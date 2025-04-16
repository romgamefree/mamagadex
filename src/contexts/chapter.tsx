"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useParams } from "next/navigation";
import { createClient } from '@supabase/supabase-js';
import useReadingHistory from "@/hooks/useReadingHistory";
import { useSettingsContext } from "./settings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Chapter {
  id: string;
  title: string;
  chapter_number: string;
  volume_number: string;
  manga_id: string;
  created_at: string;
  updated_at: string;
  mangas: Manga;
  external_url?: string;
  translated_language: string;
  images: string[];
}

interface Manga {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  created_at: string;
}

interface ChapterContextType {
  chapterId: string;
  chapter: Chapter | null;
  manga: Manga | null;
  chapters: Chapter[];
  next: () => void;
  prev: () => void;
  goTo: (id: string) => void;
  canNext: boolean;
  canPrev: boolean;
}

const ChapterContext = createContext<ChapterContextType>({
  chapterId: "",
  chapter: null,
  manga: null,
  chapters: [],
  next: () => {},
  prev: () => {},
  goTo: () => {},
  canNext: false,
  canPrev: false,
});

export const ChapterContextProvider = ({
  children,
  prefectchedChapter,
}: {
  children: React.ReactNode;
  prefectchedChapter: Chapter;
}) => {
  const params = useParams();
  const chapterId = params?.id as string;
  const { addHistory } = useReadingHistory();

  const [chapter, setChapter] = useState<Chapter | null>(prefectchedChapter);
  const [manga, setManga] = useState<Manga | null>(prefectchedChapter.mangas);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    const fetchChapters = async () => {
      const { data: chaptersData, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('manga_id', prefectchedChapter.manga_id)
        .order('chapter_number', { ascending: false });

      if (error) {
        console.error('Error fetching chapters:', error);
        return;
      }

      setChapters(chaptersData);
      const index = chaptersData.findIndex((c: Chapter) => c.id === chapterId);
      setCurrentIndex(index);
    };

    fetchChapters();
  }, [chapterId, prefectchedChapter.manga_id]);

  const canNext = useMemo(() => currentIndex > 0, [currentIndex]);
  const canPrev = useMemo(() => currentIndex < chapters.length - 1, [currentIndex, chapters.length]);

  const next = useCallback(() => {
    if (!canNext) return;
    const nextChapter = chapters[currentIndex - 1];
    goTo(nextChapter.id);
  }, [canNext, chapters, currentIndex]);

  const prev = useCallback(() => {
    if (!canPrev) return;
    const prevChapter = chapters[currentIndex + 1];
    goTo(prevChapter.id);
  }, [canPrev, chapters, currentIndex]);

  const goTo = useCallback((id: string) => {
    if (!id) return;
    window.location.href = `/nettrom/chuong/${id}`;
  }, []);

  useEffect(() => {
    if (manga && chapter) {
      addHistory(manga.id, {
        mangaTitle: manga.title,
        cover: manga.cover_url,
        chapterTitle: chapter.title,
        chapterId: chapter.id,
      });
    }
  }, [manga, chapter, addHistory]);

  const value = useMemo(
    () => ({
      chapterId,
      chapter,
      manga,
      chapters,
      next,
      prev,
      goTo,
      canNext,
      canPrev,
    }),
    [chapterId, chapter, manga, chapters, next, prev, goTo, canNext, canPrev]
  );

  return (
    <ChapterContext.Provider value={value}>
      {children}
    </ChapterContext.Provider>
  );
};

export const useChapterContext = () => useContext(ChapterContext);
