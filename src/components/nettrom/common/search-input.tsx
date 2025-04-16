"use client";

import { useSearchParams } from "next/navigation";
import { MouseEvent, useCallback, useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { createClient } from '@supabase/supabase-js';
import { MangaDetail } from '@/types/supabase';

import { Utils } from "@/utils";
import useDebounce from "@/hooks/useDebounce";
import { DataLoader } from "@/components/DataLoader";
import Link from "next/link";
import { Constants } from "@/constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SearchInput() {
  const params = useSearchParams();
  const router = useRouter();
  const [title, setTitle] = useState(params.get("title") || "");
  const deboucedTitle = useDebounce(title, 500);
  const [mangaList, setMangaList] = useState<MangaDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMangas = async () => {
      if (!deboucedTitle) {
        setMangaList([]);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('mangas')
          .select('*')
          .ilike('title', `%${deboucedTitle}%`)
          .limit(10);

        if (error) throw error;
        setMangaList(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMangas();
  }, [deboucedTitle]);

  const handleSubmit = (event: any) => {
    event.preventDefault();
    const options = Utils.Mangadex.normalizeParams(params);
    options.title = title;
    clearTitle();
    router.push(Utils.Url.getSearchNetTromUrl(options));
  };

  const clearTitle = useCallback(() => setTitle(""), [setTitle]);

  const handleBackdropClick = useCallback(
    (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.id === "suggest-backdrop") {
        clearTitle();
      }
    },
    [clearTitle],
  );

  return (
    <form onSubmit={handleSubmit} className="input-group">
      <input
        type="text"
        className="searchinput form-control"
        placeholder="Tìm truyện..."
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className="input-group-btn">
        <input
          type="submit"
          value=""
          className="searchbutton btn btn-default"
          onClick={handleSubmit}
        />
      </div>
      {title && (
        <>
          <div
            id="suggest-backdrop"
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            onClick={handleBackdropClick}
          ></div>
          <div className="suggestsearch">
            {
              <DataLoader isLoading={isLoading} error={error}>
                <></>
              </DataLoader>
            }
            <ul>
              {mangaList.map((manga) => {
                const title = manga.title;
                const altTitles = manga.alt_titles || [];
                const cover = manga.cover_image;
                return (
                  <li key={manga.id}>
                    <Link
                      href={Constants.Routes.nettrom.manga(manga.id)}
                      onClick={clearTitle}
                    >
                      <img
                        className="lazy image-thumb"
                        src={cover}
                        alt={title}
                      />
                      <h3>{title}</h3>
                      <h4>
                        <i>{altTitles.join(",")}</i>
                        <i>
                          <b>
                            {manga.author || "N/A"} - {manga.artist || "N/A"}{" "}
                          </b>
                        </i>
                        <i>
                          {manga.genres?.join(", ")}
                        </i>
                      </h4>
                    </Link>
                  </li>
                );
              })}
              {!isLoading && mangaList.length === 0 && (
                <li className="px-2 text-black">
                  <h3>Không tìm thấy truyện nào</h3>
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </form>
  );
}
