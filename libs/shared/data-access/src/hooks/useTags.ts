import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Tag } from '../lib/types';

// Query keys
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  search: (query: string) => [...tagKeys.lists(), { query }] as const,
  detail: (id: string) => [...tagKeys.all, 'detail', id] as const,
};

// Get all tags (or search)
export const useTags = (query?: string) => {
  return useQuery({
    queryKey: query ? tagKeys.search(query) : tagKeys.lists(),
    queryFn: async (): Promise<Tag[]> => {
      const params = query ? { q: query } : {};
      const response = await apiClient.get<Tag[]>('/tags', { params });
      // Response interceptor already returns response.data
      return response.data;
    },
  });
};

// Get single tag
export const useTag = (id: string) => {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: async (): Promise<Tag> => {
      const response = await apiClient.get<Tag>(`/tags/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create tag (for when user types a new tag)
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string): Promise<Tag> => {
      const response = await apiClient.post<Tag>('/tags', { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
};
