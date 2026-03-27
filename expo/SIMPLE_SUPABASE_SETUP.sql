-- =====================================================
-- RECEIPTLY SUPABASE DATABASE SETUP
-- =====================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- Then click "RUN" to create all tables and security policies

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.receipts CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Create receipts table
CREATE TABLE public.receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    merchant TEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2),
    category TEXT NOT NULL,
    receipt_date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    image_url TEXT,
    notes TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES FOR RECEIPTS
-- =====================================================

CREATE POLICY "Users can view their own receipts" ON public.receipts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts" ON public.receipts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts" ON public.receipts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts" ON public.receipts
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE RLS POLICIES FOR CATEGORIES
-- =====================================================

CREATE POLICY "Users can view their own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX idx_receipts_created_at ON public.receipts(created_at DESC);
CREATE INDEX idx_receipts_category ON public.receipts(category);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- =====================================================
-- CREATE TRIGGER FUNCTION FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for receipts
CREATE TRIGGER update_receipts_updated_at 
    BEFORE UPDATE ON public.receipts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT CATEGORIES
-- =====================================================
-- Note: These will be inserted per user when they first sign up
-- This is handled in the app code, not here

-- =====================================================
-- VERIFY SETUP
-- =====================================================
-- Run these queries to verify everything was created correctly:

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your database is now ready for the Receiptly app.
-- Users can now sign up and start saving receipts!