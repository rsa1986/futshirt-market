import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cycxfdhcfxjsrikwqknw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3hmZGhjZnhqc3Jpa3dxa253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDc2NjMsImV4cCI6MjA5NTMyMzY2M30.bn2wIPn_NKyN6Ufv9EiiswDZKmKOKx3VT1FGUNr0HTo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);