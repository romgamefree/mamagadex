import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MangaDetail } from '@/types/supabase';

export function useFeaturedTitles() {
  const [mangaList, setMangaList] = useState<MangaDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchFeaturedTitles() {
    try {
      setIsLoading(true);
      setError(null);
      
      // todo: sau này order by follows cho truyện đề cử
      const { data, error: supabaseError } = await supabase
        .from('mangas')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message);
      }

      if (!data) {
        throw new Error('No data returned from Supabase');
      }

      setMangaList(data);
    } catch (err) {
      console.error('Error fetching featured titles:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch featured titles'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchFeaturedTitles();
  }, []);

  return {
    mangaList,
    isLoading,
    error,
    mutate: fetchFeaturedTitles
  };
} 