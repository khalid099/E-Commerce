import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { PaginatedResponse, Product, Category, ApiResponse } from '@ecommerce/shared-types';

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  page?: string;
  limit?: string;
}

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  }),
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, ProductQueryParams>({
      query: (params) => ({
        url: '/products',
        params,
      }),
      transformResponse: (response: ApiResponse<PaginatedResponse<Product>>) => response.data,
    }),

    getProduct: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      transformResponse: (response: ApiResponse<Product>) => response.data,
    }),

    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      transformResponse: (response: ApiResponse<Category[]>) => response.data,
    }),
  }),
});

export const { useGetProductsQuery, useGetProductQuery, useGetCategoriesQuery } = productsApi;
