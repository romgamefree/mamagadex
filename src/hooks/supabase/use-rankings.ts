import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MangaDetail } from '@/types/supabase';

type RankingType = 'top' | 'favorite' | 'new';

export function useRankings(type: RankingType) {
  const [mangaList, setMangaList] = useState<MangaDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchRankings() {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching ${type} ranking data...`);
      
      let query = supabase
        .from('mangas')
        .select('*');

      // Apply different ordering based on type
      switch (type) {
        case 'top':
          query = query.order('rating', { ascending: false });
          break;
        case 'favorite':
          query = query.order('follows', { ascending: false });
          break;
        case 'new':
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error: supabaseError } = await query;

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
      console.error('Error fetching rankings:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch ranking data'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRankings();
  }, [type]);

  return {
    mangaList,
    isLoading,
    error,
    mutate: fetchRankings
  };
} 