import { AppApi } from "@/api";
import useSWR from "swr";
import { RecentCommentListResponse } from "@/types";

export default function useRecentComments() {
  return useSWR<RecentCommentListResponse>("recent-comments", async () => {
    const response = await AppApi.Comment.getRecentCommentList({ limit: 15 });
    return { comments: response.data };
  });
}
