import useSWR from "swr/immutable";
import { createClient } from '@supabase/supabase-js';
import { useSettingsContext } from "@/contexts/settings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function useChapterPages(chapterId: string | null) {
  const { dataSaver } = useSettingsContext();
  
  const { data, isLoading, error } = useSWR(
    chapterId ? ["chapter-pages", chapterId] : null,
    async () => {
      const { data: chapter, error } = await supabase
        .from('chapters')
        .select('images')
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      return chapter?.images || [];
    }
  );

  return { pages: data || [], isLoading, error };
}
