import { FC } from "react";
import { useChapterContext } from "@/contexts/chapter";
import { Select } from "../Select";
import { twMerge } from "tailwind-merge";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { Button } from "../Button";
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaEllipsisV,
  FaList,
} from "react-icons/fa";
import useScrollOffset from "@/hooks/useScrollOffset";
import Link from "next/link";
import { Constants } from "@/constants";
import { useSettingsContext } from "@/contexts/settings";

export const ChapterControlBar: FC<{}> = () => {
  const { manga, canNext, canPrev, next, prev, chapters, goTo, chapterId } =
    useChapterContext();
  const { onToggleDrawer } = useSettingsContext();
  const scrollDirection = useScrollDirection();
  const { isAtBottom, isAtTop } = useScrollOffset();

  const items = chapters.map((chapter) => ({
    label: `Chương ${chapter.chapter_number} ${chapter.title ? `- ${chapter.title}` : ""}`,
    value: chapter.id,
  }));

  const currentChapter = chapters.find((c) => c.id === chapterId);

  return (
    <div
      className={twMerge(
        "sticky top-0 z-50 flex w-full items-center justify-between gap-4 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        scrollDirection === "down" && !isAtTop && "-translate-y-full",
      )}
    >
      <div className="flex items-center gap-4">
        <Link href={Constants.Routes.nettrom.manga(manga?.id || "")}>
          <Button icon={<FaArrowLeft />} />
        </Link>
        <Select
          value={currentChapter?.id}
          items={items}
          onValueChange={(value) => goTo(value)}
          classNames={{
            select: "w-[200px]",
          }}
        />
      </div>
      <div className="flex items-center gap-4">
        <Button
          icon={<FaArrowUp />}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <Button
          icon={<FaList />}
          onClick={() => onToggleDrawer()}
        />
        <Button
          icon={<FaEllipsisV />}
          onClick={() => onToggleDrawer()}
        />
      </div>
    </div>
  );
};
