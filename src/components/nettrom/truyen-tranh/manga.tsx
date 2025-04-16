"use client";

import React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { FaExclamationTriangle } from "react-icons/fa";
import { createClient } from '@supabase/supabase-js';
import { MangaDetail, Chapter } from '@/types/supabase';

import { useMangadex } from "@/contexts/mangadex";
import Iconify from "@/components/iconify";
import { Utils } from "@/utils";
import ChapterList from "./chapter-list";
import { Constants } from "@/constants";
import { AspectRatio } from "@/components/shadcn/aspect-ratio";
import { Button } from "../Button";
import { DataLoader } from "@/components/DataLoader";
import { useSettingsContext } from "@/contexts/settings";

import FirstChapterButton from "./first-chapter-button";
import ExternalLinks from "./external-links";
import Markdown from "../Markdown";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Manga({
  mangaId,
  prefetchedManga,
  prefetchedChapters,
}: {
  mangaId: string;
  prefetchedManga: MangaDetail;
  prefetchedChapters?: Chapter[];
}) {
  const { mangas, updateMangas, updateMangaStatistics, mangaStatistics } =
    useMangadex();
  const { filteredLanguages, filteredContent } = useSettingsContext();
  const [manga, setManga] = useState<MangaDetail | null>(prefetchedManga);
  const [chapters, setChapters] = useState<Chapter[]>(prefetchedChapters || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const title = manga?.title || '';
  const altTitles = manga?.alt_titles || [];
  const url = Constants.Routes.nettrom.manga(mangaId);
  const [page, setPage] = useState(0);
  const [showPorngraphic, setShowPorngraphic] = useState(false);

  const handleLogin = () => {
    router.push(Constants.Routes.loginWithRedirect(window.location.pathname));
  };

  const handleConfirmPorngraphic = useCallback(() => {
    setShowPorngraphic(true);
  }, [setShowPorngraphic]);

  const followManga = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mangas')
        .update({ is_followed: !manga?.is_followed })
        .eq('id', mangaId)
        .select()
        .single();

      if (error) throw error;

      toast(data.is_followed ? "Theo dõi thành công" : "Bỏ theo dõi thành công");
    } catch {
      toast("Đã có lỗi xảy ra");
    }
  }, [mangaId, manga?.is_followed]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch manga data from Supabase
        const { data: mangaData, error: mangaError } = await supabase
          .from('mangas')
          .select('*')
          .eq('id', mangaId)
          .single();

        if (mangaError) {
          console.error('Manga fetch error:', mangaError);
          throw mangaError;
        }
        console.log('Manga data:', mangaData);
        setManga(mangaData);

        // Fetch chapters from Supabase
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('manga_id', mangaId)
          .order('chapter_number', { ascending: false });

        if (chaptersError) {
          console.error('Chapters fetch error:', chaptersError);
          throw chaptersError;
        }
        setChapters(chaptersData);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (!prefetchedManga || !prefetchedChapters) {
      fetchData();
    }
  }, [mangaId, prefetchedManga, prefetchedChapters]);

  // Fix key prop warning in breadcrumb list
  const breadcrumbItems = [
    {
      href: Constants.Routes.nettrom.index,
      name: "Trang chủ",
      position: 1,
    },
    {
      href: Constants.Routes.nettrom.search,
      name: "Truyện Tranh",
      position: 2,
    },
  ];

  if (loading) {
    return (
      <DataLoader isLoading={true} loadingText="Đang tải thông tin truyện...">
        <div />
      </DataLoader>
    );
  }

  if (error) {
    return (
      <DataLoader isLoading={false} error={error}>
        <div />
      </DataLoader>
    );
  }

  if (!manga) {
    return (
      <DataLoader isLoading={false} error={new Error('Không tìm thấy truyện')}>
        <div />
      </DataLoader>
    );
  }

  if (
    !showPorngraphic &&
    !filteredContent.includes('pornographic') &&
    manga.content_rating === 'pornographic'
  )
    return (
      <div className="mb-2">
        <div className="flex flex-col justify-center">
          <FaExclamationTriangle className="mx-auto text-[100px] text-red-600" />
          <p className="text-center">
            Truyện có thể có nội dung phản cảm và bạn đang thiết lập cài đặt lọc
            những bộ truyện có nội dung "bùng lổ"
          </p>
        </div>
        <div className="mt-4 flex justify-center">
          <Button onClick={handleConfirmPorngraphic}>
            Tôi chịu trách nhiệm với quyết định của mình
          </Button>
        </div>
      </div>
    );

  return (
    <DataLoader
      isLoading={false}
      loadingText="Đang tải thông tin truyện..."
      error={null}
    >
      <ul
        className="mb-2 inline-flex items-center gap-4"
        itemType="http://schema.org/BreadcrumbList"
      >
        {breadcrumbItems.map((item, index, arr) => {
          const isLast = index === arr.length - 1;
          return (
            <React.Fragment key={`breadcrumb-${item.href}`}>
              <li
                itemProp="itemListElement"
                itemType="http://schema.org/ListItem"
              >
                <Link
                  href={item.href}
                  className="text-web-title transition hover:text-web-titleLighter"
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
                <meta itemProp="position" content={item.position.toString()} />
              </li>
              {!isLast && (
                <li className="text-muted-foreground" key={`divider-${item.href}`}>
                  /
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ul>
      <article id="" className="dark:text-foreground">
        <div className="mb-[16px]">
          <h1 className="my-0 mb-4 text-[32px] font-semibold leading-tight">
            {title}
          </h1>
          <p className="inline-flex w-full gap-8 text-muted-foreground">
            <span key="rating">
              <i className="fa fa-star mr-2"></i>
              <span className="block sm:inline">
                <span className="text-foreground">
                  {manga.rating?.toFixed(2) || 10}
                </span>
                <span className="mx-2">/</span>
                <span itemProp="bestRating">10</span>
              </span>
            </span>
            <span key="follows">
              <i className="fa fa-heart mr-2" />
              <span className="block text-foreground sm:inline">
                {Utils.Number.formatViews(manga.follows || 0)}
              </span>
            </span>
            <span key="comments">
              <i className="fa fa-comment mr-2" />
              <span className="block text-foreground sm:inline">
                {Utils.Number.formatViews(manga.comment_count || 0)}
              </span>
            </span>
            <span className="lg:grow" key="spacer"></span>
            <span className="text-muted-foreground" key="updated">
              <i className="fa fa-clock mr-2" />
              <span className="block sm:inline">
                <span className="hidden lg:inline">Cập nhật lúc: </span>
                <span className="text-foreground">
                  {manga.updated_at
                    ? Utils.Date.formatNowDistance(new Date(manga.updated_at))
                    : ""}{" "}
                  trước
                </span>
              </span>
            </span>
          </p>
        </div>
        <div className="detail-info mb-10">
          <div className="grid grid-cols-[1fr_2fr] gap-10">
            <div className="">
              <div className="relative w-full">
                <AspectRatio
                  className="overflow-hidden rounded-lg shadow-lg"
                  ratio={Constants.Nettrom.MANGA_COVER_RATIO}
                >
                  <img
                    className="h-full w-full object-cover"
                    src={manga.cover_image}
                    alt={title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/default-cover.jpg";
                    }}
                  />
                </AspectRatio>
              </div>
            </div>
            <div>
              <ul className="[&>li]:grid [&>li]:lg:grid-cols-[1fr_2fr]">
                {altTitles.length > 0 && (
                  <li className="">
                    <p className="name mb-2 text-muted-foreground lg:mb-0">
                      <i className="fa fa-plus-square mr-2"></i> Tên khác
                    </p>
                    <p className="other-name inline-flex flex-wrap gap-4 pl-10 lg:pl-0">
                      {altTitles.map((altTitle, idx) => {
                        return <span key={idx}>{altTitle}</span>;
                      })}
                    </p>
                  </li>
                )}
                <li className="author">
                  <p className="name mb-2 text-muted-foreground lg:mb-0">
                    <i className="fa fa-user mr-2"></i> Tác giả
                  </p>
                  <p className="pl-10 lg:pl-0">
                    {manga.author || "N/A"}{" "}
                    <span className="text-muted-foreground">/</span>{" "}
                    {manga.artist || "N/A"}
                  </p>
                </li>
                <li className="status">
                  <p className="name mb-2 text-muted-foreground lg:mb-0">
                    <i className="fa fa-rss mr-2"></i> Tình trạng
                  </p>
                  <p className="pl-10 lg:pl-0">
                    {manga.year ? `${manga.year} - ` : ""}
                    {manga.status}
                  </p>
                </li>
                <li className="kind">
                  <p className="name mb-2 text-muted-foreground lg:mb-0">
                    <i className="fa fa-exclamation-triangle mr-2"></i> Nội dung
                  </p>
                  <p className="pl-10 lg:pl-0">
                    {manga.content_rating}
                  </p>
                </li>
                <li className="kind">
                  <p className="name mb-2 text-muted-foreground lg:mb-0">
                    <i className="fa fa-tags mr-2"></i> Thể loại
                  </p>
                  <p className="pl-10 lg:pl-0">
                    {manga.genres?.map((genre: string, idx: number) => (
                      <React.Fragment key={genre}>
                        <Link
                          href={`${Constants.Routes.nettrom.search}?genre=${genre}`}
                          className="text-web-title transition hover:text-web-titleLighter"
                        >
                          {genre}
                        </Link>
                        {idx !== manga.genres.length - 1 && (
                          <span className="text-muted-foreground">
                            ,{" "}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                </li>
                <li className="">
                  <p className="name mb-2 text-muted-foreground lg:mb-0">
                    <i className="fa fa-globe mr-2"></i> Ngôn ngữ gốc
                  </p>
                  <p className="flex items-center gap-2 pl-10 lg:pl-0">
                    <Iconify
                      icon={`circle-flags:lang-${manga.original_language}`}
                      className="inline-block"
                    />
                    <span>
                      {manga.original_language}
                    </span>
                  </p>
                </li>
                <li className="">
                  <p className="name mb-2 text-muted-foreground lg:mb-0">
                    <i className="fa fa-chain mr-2"></i> Nguồn
                  </p>
                  {manga && (
                    <ExternalLinks
                      links={manga.external_links || []}
                      mangaId={manga.id}
                    />
                  )}
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-[1fr_2fr] sm:gap-10">
            <div></div>
            <div className="grid flex-wrap gap-4 sm:flex sm:grid-cols-2">
              <FirstChapterButton mangaId={mangaId} />
              {manga.is_followed !== null ? (
                <Button
                  className="w-full border-red-500 text-red-500 hover:bg-red-300/10 hover:text-red-500 sm:w-auto"
                  icon={
                    <Iconify
                      icon={
                        manga.is_followed ? "fa:times-circle" : "fa:heart"
                      }
                    />
                  }
                  variant={"outline"}
                  onClick={followManga}
                >
                  <span>
                    {manga.is_followed ? "Bỏ theo dõi" : "Theo dõi"}
                  </span>
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  icon={<Iconify icon="fa:heart" />}
                  variant={"outline"}
                  onClick={handleLogin}
                >
                  Đăng nhập để theo dõi
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="detail-content mb-10">
          <h2 className="mb-4 flex items-center gap-4 text-[20px] font-medium text-web-title">
            <i className="fa fa-pen"></i>
            <span>Nội dung</span>
          </h2>
          <div className="w-full">
            <Markdown content={manga.description || ""} />
            <p className="text-muted-foreground">
              Truyện tranh{" "}
              <Link
                href={url}
                className="text-web-title transition hover:text-web-titleLighter"
              >
                {title}
              </Link>{" "}
              được cập nhật nhanh và đầy đủ nhất tại{" "}
              <Link
                href={"/"}
                className="text-web-title transition hover:text-web-titleLighter"
              >
                {Constants.APP_NAME}
              </Link>
              . Bạn đọc đừng quên để lại bình luận và chia sẻ, ủng hộ{" "}
              {Constants.APP_NAME} ra các chương mới nhất của truyện{" "}
              <Link
                href={url}
                className="text-web-title transition hover:text-web-titleLighter"
              >
                {title}
              </Link>
              .
            </p>
          </div>
        </div>
        <ChapterList
          mangaId={mangaId}
          page={page}
          onPageChange={setPage}
          data={{
            total: chapters.length,
            offset: page * Constants.Mangadex.CHAPTER_LIST_LIMIT,
            data: chapters,
          }}
          items={chapters}
        />
      </article>
    </DataLoader>
  );
}
