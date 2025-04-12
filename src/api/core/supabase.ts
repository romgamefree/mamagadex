import { createClient } from '@supabase/supabase-js';
import { Constants } from '@/constants';

const supabase = createClient(
  Constants.SUPABASE_URL,
  Constants.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export { supabase };