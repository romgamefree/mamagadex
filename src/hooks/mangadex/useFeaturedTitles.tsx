import { createClient } from '@supabase/supabase-js';
import { useSettingsContext } from "@/contexts/settings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function useFeaturedTitles() {
  const createdAtSince = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const { filteredLanguages, filteredContent, originLanguages } = useSettingsContext();

  const fetchFeaturedTitles = async () => {
    const { data, error } = await supabase
      .from('mangas')
      .select('*')
      .order('created_at', { ascending: false })
      .gte('created_at', createdAtSince.toISOString())
      .limit(12);

    if (error) throw error;
    return data;
  };

  return fetchFeaturedTitles();
}
