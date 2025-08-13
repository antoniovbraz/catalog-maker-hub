export type PostgrestResponse<T = unknown> = { data: T; error: unknown };

export type PostgrestQueryMock<T = unknown> = {
  select: (...args: unknown[]) => PostgrestQueryMock<T> | Promise<PostgrestResponse<T>>;
  order?: (...args: unknown[]) => Promise<PostgrestResponse<T>>;
  eq?: (...args: unknown[]) => Promise<PostgrestResponse<T>> | PostgrestQueryMock<T>;
  neq?: (...args: unknown[]) => Promise<PostgrestResponse<T>>;
  ilike?: (...args: unknown[]) => PostgrestQueryMock<T>;
  update?: (...args: unknown[]) => PostgrestQueryMock<T>;
  insert?: (...args: unknown[]) => PostgrestQueryMock<T>;
  delete?: (...args: unknown[]) => PostgrestQueryMock<T>;
  single?: () => Promise<PostgrestResponse<T>>;
  limit?: (...args: unknown[]) => PostgrestQueryMock<T>;
};
