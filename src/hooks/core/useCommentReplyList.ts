import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommentReplyList,
  storeComment,
  updateComment,
  deleteComment,
} from "@/api/core/comment";

export const useCommentReplyList = (params: {
  lastId: number;
  type: "series" | "chapter";
  typeId: string;
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comment-replies", params.lastId],
    queryFn: () => getCommentReplyList({ lastId: params.lastId }),
  });

  const { mutate: addReply } = useMutation({
    mutationFn: (content: string) =>
      storeComment({
        content,
        type: params.type,
        typeId: params.typeId,
        parentId: params.lastId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comment-replies", params.lastId],
      });
      queryClient.invalidateQueries({
        queryKey: ["comments", { type: params.type, typeId: params.typeId }],
      });
    },
  });

  const { mutate: editReply } = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      updateComment({ id, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comment-replies", params.lastId],
      });
    },
  });

  const { mutate: removeReply } = useMutation({
    mutationFn: (id: number) => deleteComment({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comment-replies", params.lastId],
      });
      queryClient.invalidateQueries({
        queryKey: ["comments", { type: params.type, typeId: params.typeId }],
      });
    },
  });

  return {
    replies: data?.data || [],
    isLoading,
    addReply,
    editReply,
    removeReply,
  };
};
