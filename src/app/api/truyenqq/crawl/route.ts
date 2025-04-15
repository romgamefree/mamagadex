import { NextResponse } from "next/server";
import { TruyenQQCrawler } from "@/api/truyenqq/crawler";

export async function POST(request: Request) {
  try {
    const { mangaUrl } = await request.json();

    if (!mangaUrl) {
      return NextResponse.json(
        { error: "URL truyện không được để trống" },
        { status: 400 },
      );
    }

    const crawler = new TruyenQQCrawler();
    const result = await crawler.crawlAndSaveEverything(mangaUrl);

    return NextResponse.json({
      success: true,
      message: "Crawl dữ liệu thành công",
      data: result,
    });
  } catch (error: any) {
    console.error("Lỗi khi crawl dữ liệu:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Đã có lỗi xảy ra khi crawl dữ liệu",
        details: error.stack,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { mangaUrl } = body;

    if (!mangaUrl) {
      return NextResponse.json(
        { error: "mangaUrl is required" },
        { status: 400 },
      );
    }

    const crawler = new TruyenQQCrawler();
    const result = await crawler.crawlAndSaveEverything(mangaUrl);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in crawl API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
