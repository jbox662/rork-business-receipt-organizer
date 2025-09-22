# 🚀 Receiptly Supabase Setup Guide

This guide will help you set up authentication and database for your Receiptly app.

## 📋 Prerequisites

- A Supabase account (free at [supabase.com](https://supabase.com))
- Your Receiptly app project

## 🔧 Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `receiptly-app` (or any name you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## 🔑 Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 📝 Step 3: Update Environment Variables

1. Open your `.env` file in the project root
2. Replace the values with your actual Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🗄️ Step 4: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `SIMPLE_SUPABASE_SETUP.sql` file
4. Paste it into the SQL editor
5. Click **"RUN"** to execute the script
6. You should see "Success. No rows returned" message

## 📁 Step 5: Setup Storage for Receipt Images

1. In your Supabase dashboard, go to **Storage**
2. Click **"Create a new bucket"**
3. Enter bucket details:
   - **Name**: `receipt-images`
   - **Public bucket**: ✅ **Enable** (so images can be viewed in the app)
   - **File size limit**: `50 MB` (optional)
   - **Allowed MIME types**: `image/*` (optional, for images only)
4. Click **"Create bucket"**
5. Click on the newly created `receipt-images` bucket
6. Go to **Policies** tab
7. Click **"Add policy"** and select **"For full customization"**
8. Add this policy for **INSERT** (allows users to upload images):
   ```sql
   CREATE POLICY "Users can upload their own receipt images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'receipt-images' AND 
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```
9. Add another policy for **SELECT** (allows users to view their images):
   ```sql
   CREATE POLICY "Users can view their own receipt images" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'receipt-images' AND 
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```
10. Add a policy for **DELETE** (allows users to delete their images):
    ```sql
    CREATE POLICY "Users can delete their own receipt images" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'receipt-images' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
    ```

## ✅ Step 6: Verify Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see two tables:
   - `receipts` - stores user receipts
   - `categories` - stores expense categories
3. Go to **Storage** and verify:
   - `receipt-images` bucket exists
   - Bucket is marked as "Public"
   - Storage policies are active

## 🔐 Step 7: Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under **Auth Settings**:
   - ✅ Enable "Enable email confirmations" (recommended)
   - ✅ Enable "Enable signup" 
3. Click **Save**

## 🧪 Step 8: Test the App

1. Restart your Expo development server:
   ```bash
   npm start
   # or
   bun start
   ```

2. Open the app and try:
   - **Sign Up**: Create a new account
   - **Sign In**: Log in with your credentials
   - **Test Connection**: Use the "Test Connection" button in the auth screen
   - **Scan Receipt**: Try scanning a receipt and saving it

## 🐛 Troubleshooting

### "URL undefined" or "Key missing" errors:
- Check that your `.env` file has the correct values
- Restart your Expo development server after changing `.env`
- Make sure the environment variable names start with `EXPO_PUBLIC_`

### "JSON Parse error: Unexpected character: o":
- This usually means the database tables weren't created
- Re-run the SQL script in Step 4
- Check that both `receipts` and `categories` tables exist

### "Permission denied" errors:
- Make sure you're signed in to the app
- Check that Row Level Security policies were created (they're in the SQL script)

### "Network request failed":
- Check your internet connection
- Verify your Supabase project is active (not paused)
- Try the "Test Connection" button in the auth screen

### "Nothing happens when saving receipt":
- Check the console logs for error messages
- Make sure you're signed in
- Verify the database tables exist

## 📱 Features That Should Work After Setup

✅ **User Authentication**
- Sign up with email/password
- Sign in/out
- Session persistence

✅ **Receipt Management**
- Scan receipts with camera or photo library
- AI-powered receipt data extraction
- Save receipts to your personal database
- **Image storage in Supabase** (images sync across devices)
- View all receipts in the app
- Edit receipt details

✅ **Categories**
- Default expense categories
- Custom category creation
- Category-based filtering

✅ **Analytics**
- Spending totals
- Category breakdowns
- Monthly summaries

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only see their own data
- **Authentication Required**: All database operations require login
- **Secure API Keys**: Environment variables keep credentials safe

## 🆘 Need Help?

If you're still having issues:

1. Check the browser/app console for error messages
2. Verify your Supabase project is active in the dashboard
3. Make sure all SQL commands ran successfully
4. Try creating a test user and receipt manually in Supabase dashboard

---

**🎉 That's it! Your Receiptly app should now be fully functional with authentication and database storage.**