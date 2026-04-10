export type ApiResponse<T> = {
  data: T;
};

export type ApiError = {
  error: string;
  message: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
