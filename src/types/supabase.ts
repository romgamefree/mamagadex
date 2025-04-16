export interface Chapter {
  id: string;
  manga_id: string;
  chapter_number: number;
  title: string;
  created_at: string;
  updated_at: string;
  images: string[];
}

export interface MangaDetail {
  id: string;
  title: string;
  author: string;
  artist: string;
  cover_image: string;
  description: string;
  status: string;
  year?: number;
  content_rating: string;
  genres: string[];
  follows: number;
  rating: number;
  comment_count: number;
  updated_at: string;
  created_at: string;
  alt_titles: string[];
  original_language: string;
  external_links?: string[];
  is_followed?: boolean;
} 