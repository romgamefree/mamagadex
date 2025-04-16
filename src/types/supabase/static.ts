export namespace SupabaseStatic {
  export enum Order {
    ASC = 'asc',
    DESC = 'desc'
  }

  export enum Status {
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
    HIATUS = 'hiatus',
    CANCELLED = 'cancelled'
  }

  export enum Format {
    MANGA = 'manga',
    MANHWA = 'manhwa',
    MANHUA = 'manhua',
    NOVEL = 'novel',
    ONE_SHOT = 'one_shot'
  }

  export enum Content {
    ECCHI = 'ecchi',
    SMUT = 'smut',
    GORE = 'gore',
    SEXUAL_VIOLENCE = 'sexual_violence'
  }

  export enum Origin {
    JAPAN = 'japan',
    KOREA = 'korea',
    CHINA = 'china',
    OTHER = 'other'
  }

  export enum Age {
    ALL = 'all',
    TEEN = 'teen',
    MATURE = 'mature'
  }

  export const OrderOptions = {
    LATEST_UPLOADED_CHAPTER: 'latestUploadedChapter',
    CREATED_AT: 'createdAt',
    FOLLOWED_COUNT: 'followedCount',
    TITLE: 'title',
    RELEVANCE: 'relevance',
    RATING: 'rating'
  } as const;

  export const OrderType = {
    '0': 'mới cập nhật',
    '1': 'truyện mới',
    '2': 'theo dõi nhiều nhất',
    '3': 'bảng chữ cái',
    '4': 'liên quan nhất',
    '5': 'đánh giá cao nhất'
  } as const;

  export const TranslatedField = {
    artists: "hoạ sĩ",
    authors: "tác giả",
    availableTranslatedLanguage: "ngôn ngữ bản dịch",
    content: "nội dung",
    origin: "quốc gia",
    age: "đối tượng",
    status: "tình trạng",
    year: "năm phát hành",
    genres: "thể loại"
  } as const;
} 