# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details and wait for it to be created

## 2. Get Your API Keys

1. Go to Project Settings > API
2. Copy the "Project URL" and "anon public" key
3. Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run the Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql` and run it
3. Copy the contents of `storage.sql` and run it

## 4. Configure Authentication

1. Go to Authentication > Providers
2. Make sure Email is enabled
3. (Optional) Disable email confirmation for easier testing:
   - Go to Authentication > Providers > Email
   - Turn off "Confirm email"

## Storage Structure

Files are organized by user ID:
- Audio files: `audio/{user_id}/{filename}`
- Cover images: `covers/{user_id}/{filename}`

## That's it!

Your database is ready. The app will handle everything else.
