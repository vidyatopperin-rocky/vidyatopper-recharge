import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gyvophegfmtzlsjxrpty.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dm9waGVnZm10emxzanhycHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODU0OTcsImV4cCI6MjA4NTM2MTQ5N30.hYjeRwt6c8krkTZ1lBNFbxz7zO9n3fykS-YJhk_kAag';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
