"use client";

import { useChapterContext } from "@/contexts/chapter";
import { DataLoader } from "@/components/DataLoader";
import { Button } from "@/components/nettrom/Button";
import useWindowSize from "@/hooks/useWindowSize";
import LazyImages from "@/components/nettrom/chuong/lazy-images";
import CommentSection from "@/components/nettrom/binh-luan/comment-section";
import { Alert } from "@/components/nettrom/Alert";
import Link from "next/link";
import Iconify from "@/components/iconify";

export default function ChapterPages() {
  const { height } = useWindowSize();
  const { chapter, next, prev, canNext, canPrev } = useChapterContext();

  return (
    <div>
      {chapter?.external_url ? (
        <div className="container flex justify-center">
          <Link href={chapter.external_url} target="_blank">
            <Button icon={<Iconify icon="fa:external-link" />}>
              Đọc tại trang chủ
            </Button>
          </Link>
        </div>
      ) : (
        <DataLoader
          isLoading={!chapter}
          loadingText="Đang tải nội dung chương..."
        >
          <div className="reading-detail box_doc">
            <LazyImages images={chapter?.images || []} threshold={(height || 1000) * 3} />
          </div>
        </DataLoader>
      )}
      <div className="container">
        <div className="mb-2 mt-4 flex flex-col gap-2">
          <Button disabled={!canNext} onClick={next}>
            Chương tiếp theo
          </Button>
          <Button disabled={!canPrev} onClick={prev}>
            Chương trước
          </Button>
        </div>
        <DataLoader isLoading={!chapter} loadingText="Đang tải bình luận...">
          {chapter?.id &&
            (!chapter || chapter.translated_language === "vi") && (
              <CommentSection type="chapter" typeId={chapter.id} />
            )}
          {chapter && chapter.translated_language !== "vi" && (
            <Alert title="Chỉ hỗ trợ bình luận tại các chương tiếng Việt" />
          )}
        </DataLoader>
      </div>
    </div>
  );
}
