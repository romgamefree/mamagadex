import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

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

interface MangaListing {
  title: string;
  url: string;
  cover_image: string;
}

export class TruyenQQCrawler {
  private baseUrl = "https://truyenqqto.com";
  private isDeleteTempImages = false; // Flag to control temp file deletion
  private headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: "https://truyenqqto.com",
    "sec-ch-ua":
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
  };

  constructor() {}

  private async retryRequest(url: string, maxRetries = 3, delay = 1000): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(url, { 
          headers: this.headers,
          timeout: 5000 // 5 seconds timeout
        });
        return response;
      } catch (error: any) {
        if (i === maxRetries - 1) throw error;
        console.log(`Retry attempt ${i + 1} failed, waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Helper function to process images in batches
  private async processBatch<T>(items: T[], batchSize: number, processor: (item: T) => Promise<any>): Promise<any[]> {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item).catch(error => {
          console.error('Error processing item:', error);
          return null;
        }))
      );
      results.push(...batchResults.filter(result => result !== null));
      // Small delay between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return results;
  }

  async crawlManga(url: string): Promise<MangaData> {
    try {
      const response = await this.retryRequest(url);
      const $ = cheerio.load(response.data);

      const title = $(".book_detail h1").text().trim();
      const description = $(".detail-content p").text().trim();
      const coverImage = $(".book_avatar img").attr("src") || "";
      const status = $(".book_info .status p")
        .text()
        .trim()
        .replace("Tình trạng", "")
        .trim();
      const author = $(".book_info .author p")
        .text()
        .trim()
        .replace("Tác giả", "")
        .trim();

      // Fixed genre extraction using the correct class selectors
      const genres = $(".list01 .li03 a")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((genre) => genre.length > 0);

      return {
        title,
        description,
        cover_image: coverImage,
        source_url: url,
        status,
        author,
        genres,
      };
    } catch (error) {
      console.error("Error crawling manga:", error);
      throw error;
    }
  }

  async crawlChapter(url: string, mangaId: string): Promise<ChapterData> {
    try {
      console.log("Crawling chapter:", url, "mangaId:", mangaId);
      const response = await this.retryRequest(url);
      const $ = cheerio.load(response.data);

      // Get chapter number from URL and clean it
      // URL format: /truyen-tranh/isekai-tensei-no-boukensha-6865-chap-3.html
      let chapterNumber = url.match(/chap-([\d\.-]+)/)?.[1] || "";
      // Remove trailing dot if exists
      chapterNumber = chapterNumber.replace(/\.$/, "");

      // Get publication date from the chapter list page
      const mangaUrl = url.replace(/\/chap-[\d\.-]+\.html$/, "");
      const chapterListResponse = await this.retryRequest(mangaUrl);
      const chapterList$ = cheerio.load(chapterListResponse.data);
      
      // Find the publication date for this specific chapter
      const chapterFileName = url.split('/').pop() || "";
      const publicationDate = chapterList$(`.works-chapter-item a[href*="${chapterFileName}"]`)
        .closest('.works-chapter-item')
        .find('.time-chap')
        .text()
        .trim();

      // If publication date is empty, try to get it from the current page
      const fallbackDate = $('.chapter-title .time').text().trim() || 
                          $('.chapter-title').next('.time').text().trim() ||
                          new Date().toISOString().split('T')[0];

      // Updated image extraction logic with query parameter cleaning
      const images = $(".page-chapter img")
        .map((_, el) => {
          // Try to get image URL in this order: data-original -> data-cdn -> src
          const src =
            $(el).attr("data-original") ||
            $(el).attr("data-cdn") ||
            $(el).attr("src") ||
            "";

          // Clean the URL by removing query parameters
          const cleanUrl = src.trim().split("?")[0];

          return cleanUrl;
        })
        .get()
        .filter((src) => src.length > 0)
        .map((src) => (src.startsWith("http") ? src : `${this.baseUrl}${src}`));

      console.log(`Found ${images.length} images in chapter ${chapterNumber}`);

      // Validate that we actually found images
      if (images.length === 0) {
        throw new Error(
          `No images found in chapter ${chapterNumber} at URL ${url}`,
        );
      }

      return {
        chapter_number: chapterNumber,
        title: publicationDate || fallbackDate, // Use fallback date if publication date is empty
        source_url: url,
        images,
        manga_id: mangaId,
      };
    } catch (error) {
      console.error("Error crawling chapter:", error);
      throw error;
    }
  }

  private async saveImageLocally(
    imageUrl: string,
    mangaTitle: string,
    chapterNumber?: string,
    imageIndex?: number,
    isForCover: boolean = false,
  ): Promise<string> {
    try {
      // Create base temp directory if it doesn't exist
      const baseTempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(baseTempDir)) {
        await mkdirAsync(baseTempDir, { recursive: true });
      }

      // Create manga directory with slugified title
      const mangaSlug = mangaTitle
        .toLowerCase()
        .normalize("NFD") // Normalize diacritics
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

      const mangaDir = path.join(baseTempDir, mangaSlug);
      if (!fs.existsSync(mangaDir)) {
        await mkdirAsync(mangaDir, { recursive: true });
      }

      let filePath: string;
      let targetDir: string;

      if (!isForCover && chapterNumber && imageIndex !== undefined) {
        // For chapter images
        // Format chapter number to ensure consistent format (e.g., "1" instead of "1.0")
        const formattedChapterNumber = chapterNumber.replace(/\.0+$/, "");
        targetDir = path.join(
          mangaDir,
          "chapters",
          `chap-${formattedChapterNumber}`,
        );

        // Create chapter directory
        if (!fs.existsSync(targetDir)) {
          await mkdirAsync(targetDir, { recursive: true });
        }

        // Get original image extension
        const originalExtension =
          path.extname(imageUrl).toLowerCase() || ".jpg";
        // Ensure image index starts from 1 and is sequential
        const filename = `${(imageIndex + 1).toString().padStart(3, "0")}${originalExtension}`;
        filePath = path.join(targetDir, filename);
      } else {
        // For cover image
        targetDir = path.join(mangaDir, "cover");
        // Create cover directory
        if (!fs.existsSync(targetDir)) {
          await mkdirAsync(targetDir, { recursive: true });
        }
        // Always use jpg for cover image
        filePath = path.join(targetDir, "cover.jpg");
      }

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`File already exists: ${filePath}`);
        return filePath;
      }

      // Download image with headers
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://truyenqqto.com",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "image",
          "sec-fetch-mode": "no-cors",
          "sec-fetch-site": "cross-site",
        },
        timeout: 10000, // 10 seconds timeout
      });

      // Check if response is valid image
      if (!response.headers["content-type"]?.includes("image/")) {
        throw new Error("Invalid image response");
      }

      const buffer = Buffer.from(response.data, "binary");
      await writeFileAsync(filePath, buffer);
      return filePath;
    } catch (error) {
      console.error("Error saving image locally:", error);
      throw error;
    }
  }

  private async optimizeImage(filePath: string): Promise<Buffer> {
    try {
      const sharp = require("sharp");
      const image = sharp(filePath);

      // Get image metadata
      const metadata = await image.metadata();

      // Resize if width > 1200px
      if (metadata.width && metadata.width > 1200) {
        image.resize(1200, null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert to WebP with quality 80
      return await image.webp({ quality: 80 }).toBuffer();
    } catch (error) {
      console.error("Error optimizing image:", error);
      // Return original buffer if optimization fails
      return fs.readFileSync(filePath);
    }
  }

  async saveMangaToSupabase(mangaData: MangaData) {
    try {
      // Save cover image locally
      if (mangaData.cover_image) {
        const localCoverPath = await this.saveImageLocally(
          mangaData.cover_image,
          mangaData.title,
          undefined,
          undefined,
          true, // Mark this as a cover image
        );
        mangaData.cover_image = localCoverPath;
      }

      // Check if manga already exists
      const { data: existingManga, error: checkError } = await supabase
        .from("mangas")
        .select("id")
        .eq("source_url", mangaData.source_url)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingManga) {
        // Update existing manga
        const { data, error } = await supabase
          .from("mangas")
          .update({
            title: mangaData.title,
            description: mangaData.description,
            cover_image: mangaData.cover_image,
            status: mangaData.status,
            author: mangaData.author,
            genres: mangaData.genres,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingManga.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new manga
        const { data, error } = await supabase
          .from("mangas")
          .insert([mangaData])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error saving manga:", error);
      throw error;
    }
  }

  async saveChapterToSupabase(chapterData: ChapterData, mangaTitle: string) {
    try {
      console.log(`\nSaving chapter ${chapterData.chapter_number} images...`);
      
      // Process images in parallel with batches of 3
      const processImage = async (imageData: { url: string; index: number }) => {
        try {
          console.log(`\nProcessing image ${imageData.index + 1}/${chapterData.images.length}`);
          const localImagePath = await this.saveImageLocally(
            imageData.url,
            mangaTitle,
            chapterData.chapter_number,
            imageData.index,
            false
          );
          console.log("Saved to:", localImagePath);
          return localImagePath;
        } catch (error) {
          console.error(`Error saving image ${imageData.index + 1}:`, 
            error instanceof Error ? error.message : "Unknown error"
          );
          return null;
        }
      };

      const imageDataArray = chapterData.images.map((url, index) => ({ url, index }));
      const processedImages = await this.processBatch(imageDataArray, 3, processImage);
      
      // Filter out failed images
      const successfulImages = processedImages.filter(path => path !== null);

      if (successfulImages.length === 0) {
        throw new Error("Failed to save any images for chapter");
      }

      chapterData.images = successfulImages;
      console.log(`Successfully processed ${successfulImages.length}/${chapterData.images.length} images`);

      const { data, error } = await supabase
        .from("chapters")
        .insert({
          manga_id: chapterData.manga_id,
          chapter_number: chapterData.chapter_number,
          title: chapterData.title,
          source_url: chapterData.source_url,
          images: successfulImages,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving chapter to Supabase:", error);
      throw error;
    }
  }

  async crawlMangaListings(page = 1): Promise<MangaListing[]> {
    try {
      const url = `${this.baseUrl}/danh-sach?page=${page}`;
      const response = await this.retryRequest(url);
      const $ = cheerio.load(response.data);

      const mangaListings: MangaListing[] = [];

      $(".list-story .story-item").each((_, element) => {
        const title = $(element).find(".story-name").text().trim();
        const url = $(element).find("a").attr("href") || "";
        const coverImage = $(element).find("img").attr("src") || "";

        if (title && url) {
          mangaListings.push({
            title,
            url: url.startsWith("http") ? url : `${this.baseUrl}${url}`,
            cover_image: coverImage,
          });
        }
      });

      return mangaListings;
    } catch (error) {
      console.error("Error crawling manga listings:", error);
      throw error;
    }
  }

  async crawlAllMangaPages(maxPages = 10): Promise<MangaListing[]> {
    const allManga: MangaListing[] = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`Crawling page ${page}...`);
        const mangaListings = await this.crawlMangaListings(page);

        if (mangaListings.length === 0) {
          console.log("No more manga found, stopping pagination");
          break;
        }

        allManga.push(...mangaListings);
        console.log(`Found ${mangaListings.length} manga on page ${page}`);

        // Add a small delay between pages to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error crawling page ${page}:`, error);
        // Continue with next page even if current page fails
        continue;
      }
    }

    return allManga;
  }

  async crawlAndSaveAllChapters(
    mangaId: string,
    mangaUrl: string,
    mangaTitle: string,
    isCrawlFullChapters: boolean = false,
    specificChapterNumber?: string,
  ): Promise<any[]> {
    try {
      const chapters = await this.crawlChaptersList(mangaUrl);
      const savedChapters = [];

      for (const chapter of chapters) {
        try {
          // Skip if specific chapter number is provided and doesn't match
          if (
            specificChapterNumber &&
            chapter.chapter_number !== specificChapterNumber
          ) {
            continue;
          }

          const chapterUrl = chapter.url;
          const chapterData = await this.crawlChapter(chapterUrl, mangaId);

          // Save chapter to Supabase with manga title
          const savedChapter = await this.saveChapterToSupabase(
            chapterData,
            mangaTitle,
          );
          savedChapters.push(savedChapter);

          console.log(
            `Saved chapter ${chapterData.chapter_number} for manga ${mangaTitle}`,
          );

          // If not crawling full chapters, break after first chapter
          if (!isCrawlFullChapters) {
            break;
          }
        } catch (error) {
          console.error(
            `Error processing chapter ${chapter.chapter_number}:`,
            error,
          );
          continue;
        }
      }

      return savedChapters;
    } catch (error) {
      console.error("Error crawling and saving chapters:", error);
      throw error;
    }
  }

  async crawlAndSaveAllManga(
    maxPages = 10,
    isCrawlFullChapters: boolean = false,
  ): Promise<MangaData[]> {
    const allManga = await this.crawlAllMangaPages(maxPages);
    const savedManga: MangaData[] = [];

    for (const manga of allManga) {
      try {
        const mangaData = await this.crawlManga(manga.url);
        const saved = await this.saveMangaToSupabase(mangaData);
        savedManga.push(saved);

        if (isCrawlFullChapters) {
          await this.crawlAndSaveAllChapters(
            saved.id,
            manga.url,
            mangaData.title,
            true,
          );
        }
      } catch (error) {
        console.error(`Error processing manga ${manga.title}:`, error);
        continue;
      }
    }

    return savedManga;
  }

  async crawlChaptersList(mangaUrl: string): Promise<Array<{ chapter_number: string; url: string; upload_date: string }>> {
    try {
      console.log("Crawling chapters list from:", mangaUrl);
      const response = await this.retryRequest(mangaUrl);
      const $ = cheerio.load(response.data);

      const chapters: Array<{
        chapter_number: string;
        url: string;
        upload_date: string;
      }> = [];

      // Updated selector to match exact HTML structure
      $(".list_chapter .works-chapter-list .works-chapter-item").each((_, element) => {
        const $nameChap = $(element).find(".name-chap a");
        const $timeChap = $(element).find(".time-chap");

        const href = $nameChap.attr("href") || "";
        const title = $nameChap.text().trim();
        const uploadDate = $timeChap.text().trim();

        // Extract chapter number from URL (more reliable)
        // URL format: /truyen-tranh/isekai-tensei-no-boukensha-6865-chap-3.html
        let chapterNumber = href.match(/chap-([\d\.-]+)/)?.[1] || "";
        // Remove trailing dot if exists
        chapterNumber = chapterNumber.replace(/\.$/, "");

        if (chapterNumber && href) {
          chapters.push({
            chapter_number: chapterNumber,
            url: href.startsWith("http") ? href : `${this.baseUrl}${href}`,
            upload_date: uploadDate,
          });
        }
      });

      // Sort chapters by number in ascending order (oldest first)
      const sortedChapters = chapters.sort(
        (a, b) => parseFloat(a.chapter_number) - parseFloat(b.chapter_number)
      );

      console.log(
        `Found ${sortedChapters.length} chapters:`,
        sortedChapters
          .map((c) => `Chapter ${c.chapter_number} (${c.upload_date})`)
          .join("\n")
      );

      return sortedChapters;
    } catch (error) {
      console.error("Error crawling chapters list:", error);
      throw error;
    }
  }

  async crawlChapterImages(url: string, mangaId: string): Promise<string[]> {
    try {
      console.log("Crawling chapter images:", url);
      const response = await this.retryRequest(url);
      const $ = cheerio.load(response.data);

      // Updated image extraction logic with query parameter cleaning
      const images = $(".page-chapter img")
        .map((_, el) => {
          // Try to get image URL in this order: data-original -> data-cdn -> src
          const src =
            $(el).attr("data-original") ||
            $(el).attr("data-cdn") ||
            $(el).attr("src") ||
            "";

          // Clean the URL by removing query parameters
          const cleanUrl = src.trim().split("?")[0];

          return cleanUrl;
        })
        .get()
        .filter((src) => src.length > 0)
        .map((src) => (src.startsWith("http") ? src : `${this.baseUrl}${src}`));

      console.log(`Found ${images.length} images in chapter`);

      // Validate that we actually found images
      if (images.length === 0) {
        throw new Error(`No images found in chapter at URL ${url}`);
      }

      return images;
    } catch (error) {
      console.error("Error crawling chapter images:", error);
      throw error;
    }
  }

  async crawlAndSaveEverything(mangaUrl: string): Promise<any> {
    try {
      console.log("=== Bắt đầu crawl manga ===");
      console.log("URL:", mangaUrl);

      // 1. Crawl thông tin manga
      console.log("\n1. Crawl thông tin manga...");
      const mangaData = await this.crawlManga(mangaUrl);
      console.log("- Tên manga:", mangaData.title);
      console.log("- Tác giả:", mangaData.author);
      console.log("- Thể loại:", mangaData.genres.join(", "));

      // 2. Lưu thông tin manga vào Supabase
      console.log("\n2. Lưu thông tin manga vào Supabase...");
      const savedManga = await this.saveMangaToSupabase(mangaData);
      console.log("- Đã lưu manga với ID:", savedManga.id);

      if (!savedManga?.id) {
        throw new Error("Không thể lưu thông tin manga");
      }

      // 3. Crawl danh sách chapter
      console.log("\n3. Crawl danh sách chapter...");
      const chapters = await this.crawlChaptersList(mangaUrl);
      console.log(`- Tìm thấy ${chapters.length} chapter`);

      // 4. Xử lý từng chapter
      console.log("\n4. Bắt đầu xử lý các chapter...");
      const savedChapters = [];
      const failedChapters: Array<{ number: string; url: string; error: string }> = [];

      // Process chapters từ cũ đến mới
      const sortedChapters = chapters.sort(
        (a, b) => parseFloat(a.chapter_number) - parseFloat(b.chapter_number)
      );

      // Process chapters in batches of 2
      const processChapter = async (chapter: any) => {
        try {
          console.log(`\n- Đang xử lý chapter ${chapter.chapter_number}...`);
          
          // Crawl images for this chapter
          const images = await this.crawlChapterImages(chapter.url, savedManga.id);
          console.log(`  + Tìm thấy ${images.length} ảnh`);

          // Save images locally and get local paths
          const localImagePaths = [];
          for (let i = 0; i < images.length; i++) {
            const imageUrl = images[i];
            try {
              const localPath = await this.saveImageLocally(
                imageUrl,
                mangaData.title,
                chapter.chapter_number,
                i,
                false
              );
              localImagePaths.push(localPath);
              console.log(`  + Đã lưu ảnh ${i + 1} vào: ${localPath}`);
            } catch (error) {
              console.error(`  - Lỗi lưu ảnh ${i + 1}:`, error);
              continue;
            }
          }
          
          // Save chapter to Supabase with local image paths
          const { data, error } = await supabase
            .from("chapters")
            .insert({
              manga_id: savedManga.id,
              chapter_number: chapter.chapter_number,
              title: chapter.upload_date,
              source_url: chapter.url,
              images: localImagePaths,
            })
            .select()
            .single();

          if (error) throw error;
          
          console.log("  + Đã lưu chapter thành công");
          
          return {
            number: chapter.chapter_number,
            title: chapter.upload_date,
            image_count: localImagePaths.length,
            local_paths: localImagePaths,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`  - Lỗi xử lý chapter ${chapter.chapter_number}:`, errorMessage);
          failedChapters.push({
            number: chapter.chapter_number,
            url: chapter.url,
            error: errorMessage,
          });
          return null;
        }
      };

      const processedChapters = await this.processBatch(sortedChapters, 2, processChapter);
      savedChapters.push(...processedChapters.filter(chapter => chapter !== null));

      // 5. Return results
      const result = {
        manga: {
          id: savedManga.id,
          title: mangaData.title,
          author: mangaData.author,
          cover: savedManga.cover_image,
          total_chapters: chapters.length,
        },
        statistics: {
          total_chapters: chapters.length,
          successful_chapters: savedChapters.length,
          failed_chapters: failedChapters.length,
          success_rate: `${((savedChapters.length / chapters.length) * 100).toFixed(2)}%`,
        },
        chapters: {
          successful: savedChapters,
          failed: failedChapters,
        },
        metadata: {
          source: "truyenqqto.com",
          crawled_at: new Date().toISOString(),
          execution_time: `${((Date.now() - new Date().getTime()) / 1000).toFixed(2)}s`,
        },
      };

      console.log("\n=== Kết thúc crawl manga ===");
      console.log(`Tổng số chapter: ${chapters.length}`);
      console.log(`Thành công: ${savedChapters.length}`);
      console.log(`Thất bại: ${failedChapters.length}`);

      return result;
    } catch (error) {
      console.error("Lỗi trong quá trình crawl:", error);
      throw error;
    }
  }
}
