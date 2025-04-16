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

export interface SearchOptions {
  title?: string;
  authors?: string[];
  artists?: string[];
  year?: number;
  status?: Status[];
  genres?: string[];
  format?: Format[];
  content?: Content[];
  origin?: Origin[];
  age?: Age[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: Order;
  availableTranslatedLanguage?: string[];
} 