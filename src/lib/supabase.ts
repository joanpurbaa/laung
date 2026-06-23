import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";
import { getSession } from "next-auth/react"; // Impo

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 2, 
        auth: {
      persistSession: false, 
    },
      },
    },
  },
);
