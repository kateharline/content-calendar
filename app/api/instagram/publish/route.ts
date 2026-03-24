import { NextRequest, NextResponse } from 'next/server';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

// Helper to wait for container processing
async function waitForContainer(containerId: string, accessToken: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();

    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR') return false;

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { postId, planId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Missing postId' },
        { status: 400 }
      );
    }

    // Load credentials
    let accountId: string | null = null;
    let accessToken: string | null = null;

    // Try Supabase first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Load credentials
      const { data: creds } = await supabase
        .from('ig_credentials')
        .select('*')
        .eq('id', 'default')
        .single();

      if (creds) {
        accountId = creds.ig_account_id;
        accessToken = creds.ig_access_token;
      }

      // Load the post data
      const { data: planData } = await supabase
        .from('arc_plans')
        .select('posts_data')
        .eq('id', planId)
        .single();

      if (!planData) {
        return NextResponse.json(
          { success: false, error: 'Plan not found' },
          { status: 404 }
        );
      }

      const posts = planData.posts_data as any[];
      const post = posts.find((p: any) => p.id === postId);

      if (!post) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }

      if (!accountId || !accessToken) {
        return NextResponse.json(
          { success: false, error: 'Instagram credentials not configured. Go to Settings to add them.' },
          { status: 400 }
        );
      }

      const images = (post.images || []).sort((a: any, b: any) => a.order - b.order);

      if (images.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Post has no images. Add images before publishing.' },
          { status: 400 }
        );
      }

      // Check all images have public URLs
      const nonUploadedImages = images.filter((img: any) => !img.uploaded);
      if (nonUploadedImages.length > 0) {
        return NextResponse.json(
          { success: false, error: `${nonUploadedImages.length} image(s) not yet uploaded to Supabase Storage. Images must be publicly accessible.` },
          { status: 400 }
        );
      }

      // Step 1: Create individual image containers
      const containerIds: string[] = [];

      for (const img of images) {
        const formData = new URLSearchParams();
        formData.append('image_url', img.url);
        formData.append('is_carousel_item', 'true');
        formData.append('access_token', accessToken);

        const res = await fetch(`${GRAPH_API_BASE}/${accountId}/media`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (data.error) {
          return NextResponse.json(
            { success: false, error: `Failed to create image container: ${data.error.message}` },
            { status: 400 }
          );
        }

        containerIds.push(data.id);
      }

      // Step 2: Create carousel container
      const carouselForm = new URLSearchParams();
      carouselForm.append('media_type', 'CAROUSEL');
      carouselForm.append('caption', post.caption || '');
      carouselForm.append('children', containerIds.join(','));
      carouselForm.append('access_token', accessToken);

      const carouselRes = await fetch(`${GRAPH_API_BASE}/${accountId}/media`, {
        method: 'POST',
        body: carouselForm,
      });

      const carouselData = await carouselRes.json();

      if (carouselData.error) {
        return NextResponse.json(
          { success: false, error: `Failed to create carousel: ${carouselData.error.message}` },
          { status: 400 }
        );
      }

      const carouselContainerId = carouselData.id;

      // Step 3: Wait for processing
      const ready = await waitForContainer(carouselContainerId, accessToken);

      if (!ready) {
        return NextResponse.json(
          { success: false, error: 'Carousel processing timed out. Please try again.' },
          { status: 408 }
        );
      }

      // Step 4: Publish
      const publishForm = new URLSearchParams();
      publishForm.append('creation_id', carouselContainerId);
      publishForm.append('access_token', accessToken);

      const publishRes = await fetch(`${GRAPH_API_BASE}/${accountId}/media_publish`, {
        method: 'POST',
        body: publishForm,
      });

      const publishData = await publishRes.json();

      if (publishData.error) {
        return NextResponse.json(
          { success: false, error: `Failed to publish: ${publishData.error.message}` },
          { status: 400 }
        );
      }

      const mediaId = publishData.id;

      // Get permalink
      const permalinkRes = await fetch(
        `${GRAPH_API_BASE}/${mediaId}?fields=permalink&access_token=${accessToken}`
      );
      const permalinkData = await permalinkRes.json();

      return NextResponse.json({
        success: true,
        mediaId,
        permalink: permalinkData.permalink || null,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Supabase not configured. Cannot publish without persistent storage.' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Server error: ${err}` },
      { status: 500 }
    );
  }
}
