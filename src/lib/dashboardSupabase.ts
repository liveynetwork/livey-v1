import { createClient } from "@supabase/supabase-js";

const dashboardSupabaseUrl = import.meta.env.VITE_DASHBOARD_SUPABASE_URL;
const dashboardSupabaseAnonKey = import.meta.env.VITE_DASHBOARD_SUPABASE_ANON_KEY;

if (!dashboardSupabaseUrl) {
  throw new Error("Missing VITE_DASHBOARD_SUPABASE_URL environment variable");
}

if (!dashboardSupabaseAnonKey) {
  throw new Error("Missing VITE_DASHBOARD_SUPABASE_ANON_KEY environment variable");
}

export const dashboardSupabase = createClient(
  dashboardSupabaseUrl,
  dashboardSupabaseAnonKey
);