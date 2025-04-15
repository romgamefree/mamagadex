import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommentList,
  storeComment,
  updateComment,
  deleteComment,
} from "@/api/core/comment";

export const useCommentList = (params: {
  type: "chapter" | "series";
  typeId: string;
  page?: number;
  limit?: number;
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comments", params],
    queryFn: () => getCommentList(params),
  });

  const { mutate: addComment } = useMutation({
    mutationFn: (content: string) =>
      storeComment({
        content,
        type: params.type,
        typeId: params.typeId,
        parentId: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", params] });
    },
  });

  const { mutate: editComment } = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      updateComment({ id, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", params] });
    },
  });

  const { mutate: removeComment } = useMutation({
    mutationFn: (id: number) => deleteComment({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", params] });
    },
  });

  return {
    comments: data?.data || [],
    total: data?.total || 0,
    isLoading,
    addComment,
    editComment,
    removeComment,
  };
};
