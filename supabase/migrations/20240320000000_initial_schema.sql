-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mangas table
CREATE TABLE IF NOT EXISTS public.mangas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT,
    artist TEXT,
    cover_image TEXT,
    description TEXT,
    status TEXT,
    year INTEGER,
    content_rating TEXT,
    genres TEXT[],
    follows INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alt_titles TEXT[],
    source_url TEXT UNIQUE NOT NULL,
    original_language TEXT,
    external_links TEXT[]
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    chapter_number NUMERIC(10,2) NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_url TEXT UNIQUE NOT NULL,
    images TEXT[],
    UNIQUE(manga_id, chapter_number)
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, manga_id)
);

-- Create user_ratings table
CREATE TABLE IF NOT EXISTS public.user_ratings (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, manga_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reading_history table
CREATE TABLE IF NOT EXISTS public.reading_history (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, manga_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mangas_title ON public.mangas(title);
CREATE INDEX IF NOT EXISTS idx_mangas_created_at ON public.mangas(created_at);
CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON public.chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_user_id ON public.user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_manga_id ON public.user_follows(manga_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_user_id ON public.user_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_manga_id ON public.user_ratings(manga_id);
CREATE INDEX IF NOT EXISTS idx_comments_manga_id ON public.comments(manga_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON public.comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON public.reading_history(user_id);

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_mangas_updated_at
    BEFORE UPDATE ON public.mangas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
    BEFORE UPDATE ON public.chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ratings_updated_at
    BEFORE UPDATE ON public.user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update manga statistics
CREATE OR REPLACE FUNCTION update_manga_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update follows count
    UPDATE public.mangas
    SET follows = (
        SELECT COUNT(*)
        FROM public.user_follows
        WHERE manga_id = NEW.manga_id
    )
    WHERE id = NEW.manga_id;

    -- Update rating
    UPDATE public.mangas
    SET rating = (
        SELECT AVG(rating)
        FROM public.user_ratings
        WHERE manga_id = NEW.manga_id
    )
    WHERE id = NEW.manga_id;

    -- Update comment count
    UPDATE public.mangas
    SET comment_count = (
        SELECT COUNT(*)
        FROM public.comments
        WHERE manga_id = NEW.manga_id
    )
    WHERE id = NEW.manga_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for statistics updates
CREATE TRIGGER update_manga_stats_after_follow
    AFTER INSERT OR DELETE ON public.user_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_manga_statistics();

CREATE TRIGGER update_manga_stats_after_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_manga_statistics();

CREATE TRIGGER update_manga_stats_after_comment
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_manga_statistics();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public mangas are viewable by everyone"
    ON public.mangas FOR SELECT
    USING (true);

CREATE POLICY "Public chapters are viewable by everyone"
    ON public.chapters FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own follows"
    ON public.user_follows
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ratings"
    ON public.user_ratings
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own comments"
    ON public.comments
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reading history"
    ON public.reading_history
    USING (auth.uid() = user_id); 