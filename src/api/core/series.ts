import { SeriesHomepageResponse } from "@/types";
import { supabase } from './supabase';

export const followOrUnfollow = async (seriesId: string) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // Check if already following
  const { data: existing } = await supabase
    .from('series_follows')
    .select()
    .eq('user_id', user.id)
    .eq('series_id', seriesId)
    .single();

  if (existing) {
    // Unfollow
    const { error } = await supabase
      .from('series_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('series_id', seriesId);

    if (error) throw error;
    return { followed: false };
  } else {
    // Follow
    const { error } = await supabase
      .from('series_follows')
      .insert({
        user_id: user.id,
        series_id: seriesId
      });

    if (error) throw error;
    return { followed: true };
  }
};

export const checkInfo = async (seriesId: string) => {
  const user = (await supabase.auth.getUser()).data.user;

  const [{ count: commentCount }, { data: followData }] = await Promise.all([
    supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('type', 'series')
      .eq('type_id', seriesId),
    user ? supabase
      .from('series_follows')
      .select()
      .eq('user_id', user.id)
      .eq('series_id', seriesId)
      .single() : { data: null }
  ]);

  return {
    followed: followData ? true : false,
    comment_count: commentCount || 0
  };
};

export const getHomepageSeries = async (params: {
  limit?: number;
  page?: number;
  offset?: number;
}) => {
  const limit = params.limit || 28;
  const offset = params.offset || (params.page ? (params.page - 1) * limit : 0);

  try {
    const { data, error, count } = await supabase
      .from('series')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, total: count };
  } catch (error) {
    console.error('Error fetching series:', error);
    throw error;
  }
};
