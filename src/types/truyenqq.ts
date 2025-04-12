export interface MangaData {
  title: string;
  description: string;
  cover_image: string;
  source_url: string;
  status: string;
  author: string;
  genres: string[];
}

export interface ChapterData {
  chapter_number: string;
  title: string;
  source_url: string;
  images: string[];
  manga_id: string;
}

export interface CrawlerConfig {
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  cloudflareImageDeliveryUrl?: string;
}

export interface CloudflareImageUploadResponse {
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  success: boolean;
  errors: any[];
  messages: any[];
}