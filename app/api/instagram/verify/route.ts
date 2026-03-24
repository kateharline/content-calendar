import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accountId, accessToken } = await request.json();

    if (!accountId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Missing accountId or accessToken' },
        { status: 400 }
      );
    }

    // Call Instagram Graph API to verify credentials
    const url = `https://graph.facebook.com/v21.0/${accountId}?fields=username,name,profile_picture_url&access_token=${accessToken}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { success: false, error: data.error.message || 'Invalid credentials' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      username: data.username,
      name: data.name,
      profilePicture: data.profile_picture_url,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Server error: ${err}` },
      { status: 500 }
    );
  }
}
