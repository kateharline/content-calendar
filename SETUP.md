# TruthOps Content Calendar - Setup Guide

This guide will walk you through setting up hosting on Vercel and Supabase so you can access your content calendar from anywhere.

## Prerequisites

- A GitHub account (for Vercel deployment)
- A Supabase account (free tier works fine)

---

## Step 1: Set Up Supabase Database

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `truthops-content-calendar` (or any name you prefer)
   - **Database Password**: Create a strong password (save this somewhere safe)
   - **Region**: Choose the closest region to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be created

### 1.2 Set Up the Database Schema

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### 1.3 Get Your API Keys

1. In your Supabase project dashboard, click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** under Project Settings
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)
4. **Copy both of these** - you'll need them in the next step

---

## Step 2: Set Up Vercel Deployment

### 2.1 Push Your Code to GitHub

If you haven't already:

1. Create a new repository on GitHub
2. In your project directory, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### 2.2 Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up or log in with your GitHub account
3. Click **"Add New..."** → **"Project"**
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings - leave them as default
6. **Before clicking "Deploy"**, click **"Environment Variables"** to add:

   Add these two variables:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
     **Value**: (paste your Supabase Project URL from Step 1.3)
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     **Value**: (paste your Supabase anon key from Step 1.3)

7. Click **"Add"** for each variable
8. Click **"Deploy"**
9. Wait 2-3 minutes for the deployment to complete

### 2.3 Test Your Deployment

1. Once deployment is complete, Vercel will show you a URL (like `your-app.vercel.app`)
2. Click the URL to open your app
3. Try creating a week plan - it should save to Supabase automatically
4. Open the app in a different browser or incognito mode to verify data syncs

---

## Step 3: Local Development (Optional)

If you want to test locally with Supabase:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

---

## How It Works

- **With Supabase**: Your data is stored in the cloud and accessible from any device
- **Without Supabase**: The app falls back to localStorage (browser-only storage)
- **Automatic Sync**: The app tries Supabase first, then falls back to localStorage if Supabase isn't configured

---

## Troubleshooting

### "Failed to save" errors
- Check that your Supabase environment variables are set correctly in Vercel
- Verify the database schema was created (Step 1.2)
- Check the browser console for specific error messages

### Data not syncing
- Make sure you're using the same Supabase project on all devices
- Check that Row Level Security (RLS) policies are set correctly (the schema includes a permissive policy)

### Can't access Supabase dashboard
- Make sure you're logged into the correct Supabase account
- Check that your project wasn't paused (free tier projects pause after inactivity)

---

## Next Steps

- Your app is now live and accessible from anywhere!
- Bookmark your Vercel URL for easy access
- Consider setting up a custom domain in Vercel if you want a nicer URL
