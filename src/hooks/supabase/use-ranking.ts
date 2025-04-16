import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MangaDetail } from '@/types/supabase';

export function useRanking() {
  const [mangaList, setMangaList] = useState<MangaDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchRanking() {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching ranking data...');
      
      const { data, error: supabaseError } = await supabase
        .from('mangas')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error: supabaseError });

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message);
      }

      if (!data) {
        console.warn('No data returned from Supabase');
        setMangaList([]);
        return;
      }

      console.log('Successfully fetched manga data:', data);
      setMangaList(data);
    } catch (err) {
      console.error('Error fetching ranking:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch ranking data'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRanking();
  }, []);

  return {
    mangaList,
    isLoading,
    error,
    mutate: fetchRanking
  };
} 