import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface MangaData {
  title: string;
  description: string;
  cover_image: string;
  source_url: string;
  status: string;
  author: string;
  genres: string[];
}

interface ChapterData {
  chapter_number: string;
  title: string;
  source_url: string;
  images: string[];
  manga_id: string;
}

export class TruyenQQCrawler {
  private baseUrl = 'https://truyenqqto.com';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://truyenqqto.com',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1'
  };

  private async retryRequest(url: string, maxRetries = 3, delay = 1000): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(url, { headers: this.headers });
        return response;
      } catch (error: any) {
        if (i === maxRetries - 1) throw error;
        console.log(`Retry attempt ${i + 1} failed, waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async crawlManga(url: string): Promise<MangaData> {
    try {
      const response = await this.retryRequest(url);
      console.log("---- axiot to " + url + " - " + response.data);
      const $ = cheerio.load(response.data);

      const title = $('.book_detail h1').text().trim();
      const description = $('.detail-content p').text().trim();
      const coverImage = $('.book_avatar img').attr('src') || '';
      const status = $('.book_info .status p').text().trim();
      const author = $('.book_info .author p').text().trim();
      const genres = $('.book_info .genre a')
        .map((_, el) => $(el).text().trim())
        .get();

      return {
        title,
        description,
        cover_image: coverImage,
        source_url: url,
        status,
        author,
        genres
      };
    } catch (error) {
      console.error('Error crawling manga:', error);
      throw error;
    }
  }

  async crawlChapter(url: string, mangaId: string): Promise<ChapterData> {
    try {
      const response = await this.retryRequest(url);
      const $ = cheerio.load(response.data);

      const chapterNumber = $('.chapter_title').text().match(/\d+(\.\d+)?/)?.[0] || '';
      const title = $('.chapter_title').text().trim();
      const images = $('.chapter_content img')
        .map((_, el) => $(el).attr('src'))
        .get()
        .filter((src): src is string => src !== undefined);

      return {
        chapter_number: chapterNumber,
        title,
        source_url: url,
        images,
        manga_id: mangaId
      };
    } catch (error) {
      console.error('Error crawling chapter:', error);
      throw error;
    }
  }

  async uploadImageToCloudflare(imageUrl: string): Promise<string> {
    try {
      // Download image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      // Upload to Cloudflare Images
      const formData = new FormData();
      const blob = new Blob([buffer]);
      formData.append('file', blob);

      const uploadResponse = await fetch('https://api.cloudflare.com/client/v4/accounts/5602e9defc21594f6672a8fdd4a1af52/images/v1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
        body: formData
      });

      const result = await uploadResponse.json();
      if (!result.success) {
        throw new Error('Failed to upload image to Cloudflare');
      }

      // Return the Cloudflare image URL with default variant
      return `https://imagedelivery.net/m98L5Z3BCmTzguBwbtLeqA/${result.result.id}/public`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async saveMangaToSupabase(mangaData: MangaData) {
    try {
      const { data, error } = await supabase
        .from('mangas')
        .insert([
          {
            title: mangaData.title,
            description: mangaData.description,
            cover_image: mangaData.cover_image,
            source_url: mangaData.source_url,
            status: mangaData.status,
            author: mangaData.author,
            genres: mangaData.genres
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving manga:', error);
      throw error;
    }
  }

  async saveChapterToSupabase(chapterData: ChapterData) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert([
          {
            chapter_number: chapterData.chapter_number,
            title: chapterData.title,
            source_url: chapterData.source_url,
            images: chapterData.images,
            manga_id: chapterData.manga_id
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving chapter:', error);
      throw error;
    }
  }
}