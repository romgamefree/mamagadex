import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkInfo, followOrUnfollow, getHomepageSeries } from '@/api/core/series';

export const useSeriesInfo = (seriesId: string) => {
  const queryClient = useQueryClient();

  const { data: seriesInfo, isLoading } = useQuery({
    queryKey: ['series-info', seriesId],
    queryFn: () => checkInfo(seriesId),
  });

  const { mutate: toggleFollow } = useMutation({
    mutationFn: () => followOrUnfollow(seriesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series-info', seriesId] });
    },
  });

  return {
    seriesInfo,
    isLoading,
    toggleFollow,
  };
};

export const useHomepageSeries = (params: { limit?: number; page?: number }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['homepage-series', params],
    queryFn: () => getHomepageSeries(params),
  });

  return {
    series: data?.data || [],
    total: data?.total || 0,
    isLoading,
  };
};