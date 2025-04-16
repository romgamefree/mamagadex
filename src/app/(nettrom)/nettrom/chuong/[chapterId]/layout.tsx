import { Metadata, ResolvingMetadata } from "next";
import { ChapterContextProvider } from "@/contexts/chapter";
import { Constants } from "@/constants";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getChapterData(chapterId: string) {
  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('*, mangas(*)')
    .eq('id', chapterId)
    .single();

  if (error) {
    console.error('Error fetching chapter:', error);
    throw error;
  }

  return chapter;
}

export async function generateMetadata(
  { params }: { params: { chapterId: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const chapter = await getChapterData(params.chapterId);
  const manga = chapter.mangas;

  return {
    title: `${manga.title} - Chương ${chapter.chapter_number} ${chapter.title ? `- ${chapter.title}` : ""}`,
    description: manga.description,
    openGraph: {
      title: `${manga.title} - Chương ${chapter.chapter_number} ${chapter.title ? `- ${chapter.title}` : ""}`,
      description: manga.description,
      images: [manga.cover_url],
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { chapterId: string };
}) {
  const chapter = await getChapterData(params.chapterId);

  return (
    <ChapterContextProvider prefectchedChapter={chapter}>
      <div className="mx-[-12px]">
        <div className="w-full">{children}</div>
      </div>
    </ChapterContextProvider>
  );
}
