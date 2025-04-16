import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CommentSection from "@/components/nettrom/binh-luan/comment-section";
import TopTitles from "@/components/nettrom/trang-chu/top-titles";
import Manga from "@/components/nettrom/truyen-tranh/manga";
import { MangaDetail } from "@/types/supabase";
import { Utils } from "@/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function TruyenTranh({
  params,
}: {
  params: { mangaId: string };
}) {
  // Fetch manga data from Supabase
  const { data: manga, error: mangaError } = await supabase
    .from("mangas")
    .select("*")
    .eq("id", params.mangaId)
    .single();

  if (mangaError || !manga) {
    notFound();
  }

  // Fetch chapters data from Supabase
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .eq("manga_id", params.mangaId)
    .order("chapter_number", { ascending: false });

  if (chaptersError) {
    console.error("Error fetching chapters:", chaptersError);
  }

  // Transform manga data to match MangaDetail type
  const mangaDetail: MangaDetail = {
    id: manga.id,
    title: manga.title,
    alt_titles: manga.alt_titles || [],
    description: manga.description,
    year: manga.year,
    status: manga.status,
    content_rating: manga.content_rating,
    original_language: manga.original_language,
    created_at: manga.created_at,
    updated_at: manga.updated_at,
    cover_image: manga.cover_image,
    author: manga.author,
    artist: manga.artist,
    genres: manga.genres || [],
    external_links: manga.external_links || [],
    is_followed: manga.is_followed,
    rating: manga.rating,
    follows: manga.follows,
    comment_count: manga.comment_count,
  };

  return (
    <div className="grid grid-cols-1 gap-[40px] lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Manga
          mangaId={params.mangaId}
          prefetchedManga={mangaDetail}
          prefetchedChapters={chapters || []}
        />
        <CommentSection typeId={params.mangaId} type="series" />
      </div>
      <div>
        <TopTitles />
      </div>
    </div>
  );
}
