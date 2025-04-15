export const CLOUDFLARE_CONFIG = {
  ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || "",
  API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || "",
  IMAGE_DELIVERY_URL: process.env.CLOUDFLARE_IMAGE_DELIVERY_URL || "",
};

export const TRUYENQQ_CONFIG = {
  BASE_URL: "https://truyenqqto.com",
  SELECTORS: {
    MANGA: {
      TITLE: ".book_detail h1",
      DESCRIPTION: ".detail-content p",
      COVER_IMAGE: ".book_avatar img",
      STATUS: ".book_info .status p",
      AUTHOR: ".book_info .author p",
      GENRES: ".book_info .genre a",
    },
    CHAPTER: {
      TITLE: ".chapter_title",
      IMAGES: ".chapter_content img",
    },
  },
  BATCH_SIZE: 10, // Số lượng chapter crawl đồng thời
  RETRY_ATTEMPTS: 3, // Số lần thử lại khi gặp lỗi
  DELAY_BETWEEN_REQUESTS: 1000, // Delay giữa các request (ms)
};
