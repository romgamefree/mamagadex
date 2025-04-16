"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";

import useReadingHistory from "@/hooks/useReadingHistory";
import { useHomepageSeries } from "@/hooks/supabase/useHomepageSeries";
import { Utils } from "@/utils";

import Pagination from "../Pagination";
import MangaTile, { MangaTileSkeleton } from "../manga-tile";
import { ErrorDisplay } from "../error-display";

export default function LastChapterUpdatedTitles() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const [totalPage, setTotalPage] = useState(1);
  const { history } = useReadingHistory();
  const { data, isLoading, error, mutate } = useHomepageSeries({
    limit: 28,
    page,
  });

  useEffect(() => {
    if (!data?.total) return;
    setTotalPage(Math.floor(data.total / 28));
  }, [data]);

  return (
    <div className="Module Module-163" id="new-updates">
      <div className="ModuleContent">
        <div className="items">
          <div className={`grid grid-cols-2 gap-[20px] lg:grid-cols-4`}>
            {isLoading
              ? [...Array(28)].map((_, index) => (
                  <div key={index}>
                    <MangaTileSkeleton />
                  </div>
                ))
              : data?.data.map((manga: { id: string; title: string; cover_image: string; follows: number; chapters: Array<{ id: string; title: string; updated_at: string }> }) => {
                  const readedChapters = history[manga.id];
                  return (
                    <MangaTile
                      id={manga.id}
                      key={manga.id}
                      thumbnail={manga.cover_image}
                      title={manga.title}
                      chapters={manga.chapters.map((chapter: { id: string; title: string; updated_at: string }) => ({
                        id: chapter.id,
                        title: chapter.title,
                        updatedAt: chapter.updated_at,
                        subTitle: Utils.Date.formatNowDistance(
                          new Date(chapter.updated_at),
                        ),
                      }))}
                      readedChapters={readedChapters}
                      mangaStatistic={{
                        follows: manga.follows,
                        comments: { repliesCount: 0, threadId: 0 },
                        rating: { average: 0, bayesian: 0 }
                      }}
                    />
                  );
                })}
          </div>
          {error && <ErrorDisplay error={error} refresh={mutate} />}
        </div>
        <Pagination
          onPageChange={(event) => {
            router.push(`${pathname}?page=${event.selected + 1}#new-updates`);
          }}
          pageCount={totalPage}
          forcePage={page - 1}
          marginPagesDisplayed={1}
          pageRangeDisplayed={2}
        />
      </div>
    </div>
  );
}
