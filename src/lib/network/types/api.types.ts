// Hand-written mirror of the backend's errors/apiResponse.ts,
// errors/paginatedResponse.ts and middlewares/globalErrorHandler.ts.
// Success wire shape: { message, data } (+ pagination). Error wire shape:
// { error, status, message, fields? }. Change the backend → change this file.

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  status: number;
  message: string;
  fields?: { message: string; path: string | number }[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  statusCode: number;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}
