import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MangaDetail } from '@/types/supabase';
import { SearchOptions } from '@/types/search';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const useSearchManga = (options: SearchOptions) => {
  const [mangas, setMangas] = useState<MangaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const searchManga = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('mangas')
          .select('*', { count: 'exact' })
          .ilike('title', `%${options.title || ''}%`)
          .order('title', { ascending: true })
          .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

        if (error) throw error;

        setMangas(data || []);
        setTotal(data?.length || 0);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    searchManga();
  }, [options]);

  return {
    mangas,
    loading,
    error,
    total,
  };
}; 