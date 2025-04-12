import { NextRequest, NextResponse } from 'next/server';
import { TruyenQQCrawler } from '@/api/truyenqq/crawler';

export async function POST(request: NextRequest) {
  try {
    const { mangaUrl } = await request.json();
    if (!mangaUrl) {
      return NextResponse.json(
        { error: 'URL truyện không được để trống' },
        { status: 400 }
      );
    }

    const crawler = new TruyenQQCrawler();

    // Crawl thông tin truyện
    const mangaData = await crawler.crawlManga(mangaUrl);
    
    // Lưu thông tin truyện vào Supabase
    const savedManga = await crawler.saveMangaToSupabase(mangaData);

    return NextResponse.json({
      message: 'Crawl dữ liệu thành công',
      data: savedManga
    });
  } catch (error: any) {
    console.error('Lỗi khi crawl dữ liệu:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra khi crawl dữ liệu' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { mangaId, chapterUrl } = await request.json();
    if (!mangaId || !chapterUrl) {
      return NextResponse.json(
        { error: 'ID truyện và URL chapter không được để trống' },
        { status: 400 }
      );
    }

    const crawler = new TruyenQQCrawler();

    // Crawl thông tin chapter
    const chapterData = await crawler.crawlChapter(chapterUrl, mangaId);
    
    // Upload ảnh lên Cloudflare và cập nhật URL
    const cloudflareImages = await Promise.all(
      chapterData.images.map(img => crawler.uploadImageToCloudflare(img))
    );
    chapterData.images = cloudflareImages;

    // Lưu thông tin chapter vào Supabase
    const savedChapter = await crawler.saveChapterToSupabase(chapterData);

    return NextResponse.json({
      message: 'Cập nhật chapter thành công',
      data: savedChapter
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra khi cập nhật chapter' },
      { status: 500 }
    );
  }
}