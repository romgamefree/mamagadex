import { Metadata, ResolvingMetadata } from "next";
import { createClient } from '@supabase/supabase-js';
import { Constants } from "@/constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(
  { params }: { params: { mangaId: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = params.mangaId;

  const previousImages = (await parent).openGraph?.images || [];

  try {
    const { data: manga, error } = await supabase
      .from('mangas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const image = {
      url: manga.cover_url,
      width: 1200,
      height: 630,
    };

    return {
      title: `${manga.title} - Đọc ngay tại ${Constants.APP_NAME}`,
      description: manga.description,
      openGraph: {
        images: [image],
      },
      twitter: {
        images: [image],
      },
    };
  } catch {}

  return {
    title: "Đọc ngay tại NetTrom",
    description: "NetTrom - Website Trộm Truyện Văn Minh",
    openGraph: {
      images: [...previousImages],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="">{children}</div>;
}
