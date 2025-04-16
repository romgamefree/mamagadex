import { createClient } from '@supabase/supabase-js';
import { useSettingsContext } from "@/contexts/settings";
import { MangaDetail } from "@/types/supabase";
import { useState, useEffect } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useFeaturedTitles() {
  const { filteredLanguages, filteredContent, originLanguages } = useSettingsContext();
  const createdAtSince = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [mangaList, setMangaList] = useState<MangaDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeaturedTitles = async () => {
    try {
      setIsLoading(true);
      // Get featured titles from the last 30 days, ordered by follows
      const { data: mangas, error } = await supabase
        .from('mangas')
        .select('*')
        .gte('created_at', createdAtSince.toISOString())
        .in('content_rating', filteredContent)
        .in('original_language', originLanguages)
        .order('follows', { ascending: false })
        .limit(12);

      if (error) throw error;
      setMangaList(mangas as MangaDetail[]);
    } catch (error) {
      console.error('Error fetching featured titles:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedTitles();
  }, [filteredContent, originLanguages]);

  return {
    mangaList,
    isLoading,
    error,
    mutate: fetchFeaturedTitles
  };
} 