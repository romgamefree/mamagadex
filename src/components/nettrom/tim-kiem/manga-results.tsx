"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";

import { useSearchManga } from "@/hooks/supabase/useSearchManga";
import { useMangadex } from "@/contexts/mangadex";
import { Utils } from "@/utils";
import { Constants } from "@/constants";
import { AspectRatio } from "@/components/shadcn/aspect-ratio";
import LanguageIcon from "@/components/language-icon";

import Pagination from "../Pagination";
import Markdown from "../Markdown";
import ScrollToButton from "../scroll-to-button";
import ReadMore from "../see-more";
import Skeleton from "react-loading-skeleton";

const LIMIT = 12;

export default function MangaResults() {
  const router = useRouter();
  const params = useSearchParams();
  const options = useMemo(() => Utils.Mangadex.normalizeParams(params), [params]);
  const { mangas, loading, error, total } = useSearchManga(options);
  const { updateMangaStatistics, mangaStatistics, addMangas } = useMangadex();
  const offset = params.get("offset") ? parseInt(params.get("offset")!) : 0;
  const limit = params.get("limit") ? parseInt(params.get("limit")!) : LIMIT;
  const page = Math.floor(offset / limit);
  const goToPage = (selectedItem: { selected: number }) => {
    options.offset = selectedItem.selected * limit;
    router.push(Utils.Url.getSearchNetTromUrl(options));
  };

  useEffect(() => {
    if (mangas.length > 0) {
      addMangas(mangas);
      updateMangaStatistics(mangas.map((m) => m.id));
    }
  }, [mangas, addMangas, updateMangaStatistics]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: LIMIT }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <AspectRatio ratio={2 / 3}>
              <Skeleton height="100%" />
            </AspectRatio>
            <Skeleton height={20} />
            <Skeleton height={16} width="80%" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Đã xảy ra lỗi khi tải dữ liệu</p>
        <p>{error.message}</p>
      </div>
    );
  }

  if (mangas.length === 0) {
    return (
      <div className="text-center">
        <p>Không tìm thấy truyện nào phù hợp với tiêu chí tìm kiếm</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {mangas.map((manga) => {
          const stats = mangaStatistics[manga.id];
          return (
            <div key={manga.id} className="flex flex-col gap-2">
              <Link href={Constants.Routes.nettrom.manga(manga.id)}>
                <AspectRatio ratio={2 / 3}>
                  <img
                    src={manga.cover_image}
                    alt={manga.title}
                    className="h-full w-full object-cover"
                  />
                </AspectRatio>
              </Link>
              <div className="flex flex-col gap-1">
                <Link
                  href={Constants.Routes.nettrom.manga(manga.id)}
                  className="line-clamp-2 font-medium hover:text-purple-500"
                >
                  {manga.title}
                </Link>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <span>{manga.author}</span>
                  {manga.artist && <span>• {manga.artist}</span>}
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <span>{manga.year}</span>
                  {manga.status && <span>• {manga.status}</span>}
                </div>
                {stats && (
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>{stats.follows} theo dõi</span>
                    <span>• {stats.rating}★</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {manga.genres?.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {total > LIMIT && (
        <div className="mt-4 flex justify-center">
          <Pagination
            forcePage={page}
            pageCount={Math.ceil(total / LIMIT)}
            onPageChange={goToPage}
          />
        </div>
      )}
    </>
  );
}
