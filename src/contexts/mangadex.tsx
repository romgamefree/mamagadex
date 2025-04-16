"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { uniq } from "lodash";
import { createClient } from '@supabase/supabase-js';
import { MangaDetail } from '@/types/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Mangas = { [k: string]: MangaDetail };
export type MangaStatistics = Record<string, { follows: number; rating: number }>;

export const MangadexContext = createContext<{
  mangas: Mangas;
  mangaStatistics: MangaStatistics;
  updateMangas: (ids: string[]) => Promise<void>;
  updateMangaStatistics: (ids: string[]) => Promise<void>;
  addMangas: (mangaList: MangaDetail[]) => void;
}>({
  mangas: {},
  mangaStatistics: {},
  updateMangas: () => new Promise(() => null),
  updateMangaStatistics: () => new Promise(() => null),
  addMangas: ([]) => null,
});

export const MangadexContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mangas, setMangas] = useState<Mangas>({});
  const [mangaStatistics, setMangaStatistics] = useState<MangaStatistics>({});

  const updateMangas = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;

      try {
        const { data, error } = await supabase
          .from('mangas')
          .select('*')
          .in('id', ids);

        if (error) throw error;

        if (data) {
          setMangas((prevMangas) => {
            const newMangas = { ...prevMangas };
            for (const manga of data) {
              newMangas[manga.id] = manga;
            }
            return newMangas;
          });
        }
      } catch (error) {
        console.error('Error updating mangas:', error);
      }
    },
    [setMangas],
  );

  const addMangas = useCallback(
    (mangaList: MangaDetail[]) => {
      setMangas((prevMangas) => {
        const newMangas = { ...prevMangas };
        for (const manga of mangaList) {
          newMangas[manga.id] = manga;
        }
        return newMangas;
      });
    },
    [setMangas],
  );

  const updateMangaStatistics = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;

      try {
        const { data, error } = await supabase
          .from('mangas')
          .select('id, follows, rating')
          .in('id', ids);

        if (error) throw error;

        if (data) {
          setMangaStatistics((prev) => {
            const newStats = { ...prev };
            for (const manga of data) {
              newStats[manga.id] = {
                follows: manga.follows || 0,
                rating: manga.rating || 0,
              };
            }
            return newStats;
          });
        }
      } catch (error) {
        console.error('Error updating manga statistics:', error);
      }
    },
    [setMangaStatistics],
  );

  return (
    <MangadexContext.Provider
      value={{
        mangas,
        updateMangas,
        mangaStatistics,
        updateMangaStatistics,
        addMangas,
      }}
    >
      {children}
    </MangadexContext.Provider>
  );
};

export const useMangadex = () => useContext(MangadexContext);
