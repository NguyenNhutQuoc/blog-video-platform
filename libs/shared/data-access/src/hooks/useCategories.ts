import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { Category } from '../lib/types';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
};

// Get all categories
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async (): Promise<Category[]> => {
      const response = await apiClient.get<Category[]>('/categories');
      // Response interceptor already returns response.data
      return (response as unknown as Category[]) ?? [];
    },
  });
};

// Get single category
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async (): Promise<Category> => {
      const response = await apiClient.get<Category>(`/categories/${id}`);
      return response as unknown as Category;
    },
    enabled: !!id,
  });
};
