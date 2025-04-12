import {
  CommentListResponse,
  CommentRepliesResponse,
  RecentCommentListResponse,
} from "@/types";
import { supabase } from './supabase';

export const storeComment = async (body: {
  content: string;
  type: "series" | "chapter";
  typeId: string;
  parentId: number;
}) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      content: body.content,
      type: body.type,
      type_id: body.typeId,
      parent_id: body.parentId,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateComment = async (body: { content: string; id: number }) => {
  const { data, error } = await supabase
    .from('comments')
    .update({ content: body.content })
    .eq('id', body.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteComment = async (body: { id: number }) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', body.id);

  if (error) throw error;
  return { success: true };
};

export const getCommentList = async (params: {
  type: "chapter" | "series" | "page";
  typeId: string;
  page?: number;
  limit?: number;
}) => {
  const { data, error, count } = await supabase
    .from('comments')
    .select('*, user:users(*)', { count: 'exact' })
    .eq('type', params.type)
    .eq('type_id', params.typeId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .range((params.page || 1) * (params.limit || 10) - (params.limit || 10), (params.page || 1) * (params.limit || 10) - 1);

  if (error) throw error;
  return { data, total: count };
};

export const getCommentReplyList = async (params: { lastId: number }) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(*)')
    .eq('parent_id', params.lastId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return { data };
};

export const getRecentCommentList = async (params: { limit: number }) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(*)')
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(params.limit);

  if (error) throw error;
  return { data };
};
