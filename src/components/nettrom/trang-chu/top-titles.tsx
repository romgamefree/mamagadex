"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import Skeleton from "react-loading-skeleton";
import { createClient } from '@supabase/supabase-js';
import { MangaDetail } from '@/types/supabase';

import { useMangadex } from "@/contexts/mangadex";
import { FaClock, FaHeart, FaStar, FaTrophy } from "react-icons/fa";
import { AspectRatio } from "@/components/shadcn/aspect-ratio";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { Utils } from "@/utils";
import { Constants } from "@/constants";
import { ErrorDisplay } from "../error-display";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

const MangaTile = (props: {
  manga: MangaDetail;
  title: string;
  order: number;
  hideCounter?: boolean;
  counter?: number;
  icon?: React.ReactNode;
}) => {
  const inTop3 = useMemo(() => {
    return props.order < 3;
  }, [props.order]);
  return (
    <li className="relative flex w-full gap-[8px] py-2" key={props.manga.id}>
      <div className="absolute left-4 top-0 flex h-[64px] w-8 items-center justify-center text-right">
        <span
          className={twMerge(
            `fn-order text-[64px] font-black leading-none text-muted-foreground/30 pos${props.order + 1}`,
            inTop3 && "text-muted-foreground",
          )}
        >
          {props.order + 1}
        </span>
      </div>
      <div className="flex grow items-start gap-4 pl-12">
        <Link
          className="relative w-[64px] shrink-0 rounded shadow-[-5px_0_20px_rgba(0,0,0,0.5)]"
          title={props.title}
          href={Constants.Routes.nettrom.manga(props.manga.id)}
        >
          <AspectRatio ratio={1} className="overflow-hidden rounded">
            <img
              className="lazy h-full w-full object-cover"
              src={props.manga.cover_image}
              alt={props.title}
            />
          </AspectRatio>
        </Link>
        <div className="grow">
          <h3>
            <Link
              href={Constants.Routes.nettrom.manga(props.manga.id)}
              className="line-clamp-2 font-semibold !text-white transition hover:no-underline"
            >
              {props.title}
            </Link>
          </h3>
          {/* <p className="chapter top">
            <span className="text-muted-foreground">
              {Utils.Mangadex.getOriginalMangaTitle(props.manga)}
            </span>
          </p> */}
          {!props.hideCounter && (
            <span className="mt-1 flex shrink-0 items-center gap-2 text-muted-foreground">
              {props.icon}
              {Utils.Number.formatViews(props.counter || 0)}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

const MangaTileSkeleton = (props: {
  order: number;
  hideCounter?: boolean;
  icon?: React.ReactNode;
  counter?: number;
}) => {
  const inTop3 = useMemo(() => {
    return props.order < 3;
  }, [props.order]);

  return (
    <li className="relative flex w-full gap-[8px] py-2" key={props.order}>
      <div className="absolute left-4 top-0 flex h-[64px] w-8 items-center justify-center text-right">
        <span
          className={twMerge(
            `fn-order text-[64px] font-black leading-none text-muted-foreground/30 pos${props.order + 1}`,
            inTop3 && "text-muted-foreground",
          )}
        >
          {props.order + 1}
        </span>
      </div>
      <div className="flex grow items-start gap-4 pl-12">
        <div className="relative w-[64px] shrink-0 rounded shadow-[-5px_0_20px_rgba(0,0,0,0.5)]">
          <AspectRatio ratio={1} className="overflow-hidden rounded">
            <div className="h-full w-full">
              <Skeleton height="100%" width="100%" />
            </div>
          </AspectRatio>
        </div>
        <div className="grow">
          <h3>
            <div className="line-clamp-2 font-semibold !text-white transition hover:no-underline">
              <Skeleton />
            </div>
          </h3>
          {!props.hideCounter && (
            <span className="mt-1 flex shrink-0 items-center gap-2 text-muted-foreground">
              {props.icon}
              <Skeleton width={20} />
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

export default function TopTitles({ groupId }: { groupId?: string }) {
  const [topMangaList, setTopMangaList] = useState<MangaDetail[]>([]);
  const [newMangaList, setNewMangaList] = useState<MangaDetail[]>([]);
  const [favoriteMangaList, setFavoriteMangaList] = useState<MangaDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { addMangas, updateMangaStatistics } = useMangadex();

  useEffect(() => {
    const fetchMangas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch top mangas by created_at
        const { data: topData, error: topError } = await supabase
          .from('mangas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(7);

        if (topError) {
          console.error('Error fetching top mangas:', topError);
          throw new Error(`Failed to fetch top mangas: ${topError.message}`);
        }

        if (!topData) {
          throw new Error('No data returned for top mangas');
        }

        setTopMangaList(topData);

        // Fetch new mangas
        const { data: newData, error: newError } = await supabase
          .from('mangas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(7);

        if (newError) {
          console.error('Error fetching new mangas:', newError);
          throw new Error(`Failed to fetch new mangas: ${newError.message}`);
        }

        if (!newData) {
          throw new Error('No data returned for new mangas');
        }

        setNewMangaList(newData);

        // Fetch favorite mangas by created_at
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('mangas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(7);

        if (favoriteError) {
          console.error('Error fetching favorite mangas:', favoriteError);
          throw new Error(`Failed to fetch favorite mangas: ${favoriteError.message}`);
        }

        if (!favoriteData) {
          throw new Error('No data returned for favorite mangas');
        }

        setFavoriteMangaList(favoriteData);

      } catch (err) {
        console.error('Error in fetchMangas:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch manga data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangas();
  }, []);

  useEffect(() => {
    if (topMangaList.length > 0) {
      addMangas(topMangaList);
      updateMangaStatistics(topMangaList.map((m) => m.id));
    }
  }, [topMangaList, addMangas, updateMangaStatistics]);

  useEffect(() => {
    if (favoriteMangaList.length > 0) {
      addMangas(favoriteMangaList);
      updateMangaStatistics(favoriteMangaList.map((m) => m.id));
    }
  }, [favoriteMangaList, addMangas, updateMangaStatistics]);

  if (error) {
    console.error('TopTitles error:', error);
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="">
      <div className="">
        <div className="">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-4 text-[20px] font-medium text-web-title">
              <FaTrophy />
              Bảng xếp hạng tháng này
            </h2>
          </div>
          <Tabs defaultValue="top" className="w-full">
            <TabsList className="mb-4 grid h-[48px] grid-cols-3 bg-white/10 p-2">
              <TabsTrigger
                value="top"
                className="flex h-full items-center gap-3 rounded text-[12px]"
              >
                <FaStar />
                Top
              </TabsTrigger>
              <TabsTrigger
                value="favorite"
                className="flex h-full items-center gap-3 rounded text-[12px]"
              >
                <FaHeart />
                Yêu thích
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="flex h-full items-center gap-3 rounded text-[12px]"
              >
                <FaClock />
                Mới
              </TabsTrigger>
            </TabsList>
            <TabsContent value="top">
              <ul className="flex flex-col gap-4">
                {isLoading
                  ? [...Array(7)].map((_, index) => (
                      <MangaTileSkeleton
                        order={index}
                        key={index}
                        icon={<FaStar />}
                      />
                    ))
                  : topMangaList.map((manga, index) => (
                      <MangaTile
                        key={manga.id}
                        manga={manga}
                        title={manga.title}
                        order={index}
                        icon={<FaStar />}
                        counter={manga.follows}
                      />
                    ))}
              </ul>
            </TabsContent>
            <TabsContent value="favorite">
              <ul className="flex flex-col gap-4">
                {isLoading
                  ? [...Array(7)].map((_, index) => (
                      <MangaTileSkeleton
                        order={index}
                        key={index}
                        icon={<FaHeart />}
                      />
                    ))
                  : favoriteMangaList.map((manga, index) => (
                      <MangaTile
                        key={manga.id}
                        manga={manga}
                        title={manga.title}
                        order={index}
                        icon={<FaHeart />}
                        counter={manga.rating}
                      />
                    ))}
              </ul>
            </TabsContent>
            <TabsContent value="new">
              <ul className="flex flex-col gap-4">
                {isLoading
                  ? [...Array(7)].map((_, index) => (
                      <MangaTileSkeleton
                        order={index}
                        key={index}
                        icon={<FaClock />}
                      />
                    ))
                  : newMangaList.map((manga, index) => (
                      <MangaTile
                        key={manga.id}
                        manga={manga}
                        title={manga.title}
                        order={index}
                        icon={<FaClock />}
                      />
                    ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
