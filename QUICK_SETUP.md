# Quick Setup Checklist

## Supabase Setup (5 minutes)

1. **Create Project**: [supabase.com](https://supabase.com) → New Project
2. **Run SQL**: Copy `supabase/schema.sql` → SQL Editor → Run
3. **Get Keys**: Settings → API → Copy:
   - Project URL
   - anon public key

## Vercel Setup (5 minutes)

1. **Push to GitHub**: `git push` your code
2. **Deploy**: [vercel.com](https://vercel.com) → Import GitHub repo
3. **Add Env Vars** (before deploying):
   - `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
4. **Deploy** → Done!

## What You Need to Provide

Just these two values from Supabase:
- ✅ Supabase Project URL
- ✅ Supabase anon key

Everything else is automated! 🎉

See `SETUP.md` for detailed instructions.
