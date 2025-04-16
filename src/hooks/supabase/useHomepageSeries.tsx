import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Chapter {
  id: string;
  title: string;
  updated_at: string;
}

interface Manga {
  id: string;
  title: string;
  author: string;
  cover_image: string;
  updated_at: string;
  follows: number;
  chapters: Chapter[];
}

interface UseHomepageSeriesProps {
  limit?: number;
  page?: number;
}

export function useHomepageSeries({ limit = 28, page = 1 }: UseHomepageSeriesProps) {
  const [data, setData] = useState<{ data: Manga[]; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: mangas, error: mangaError, count } = await supabase
        .from("mangas")
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (mangaError) throw mangaError;

      const mangaWithChapters = await Promise.all(
        mangas.map(async (manga: Manga) => {
          const { data: chapters } = await supabase
            .from("chapters")
            .select("*")
            .eq("manga_id", manga.id)
            .order("updated_at", { ascending: false })
            .limit(3);

          // Convert absolute path to relative path
          const coverImage = manga.cover_image.replace(/^.*\/temp\//, '/temp/');

          return {
            ...manga,
            cover_image: coverImage,
            chapters: chapters || [],
          };
        })
      );

      setData({
        data: mangaWithChapters,
        total: count || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch manga data"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit]);

  return {
    data,
    isLoading,
    error,
    mutate: fetchData,
  };
} 