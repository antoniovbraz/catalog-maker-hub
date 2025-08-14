import { Mock } from 'vitest';

export type PostgrestResponse<T = unknown> = { data: T; error: unknown };

export interface PostgrestQueryMock<T = unknown> {
  select: Mock<unknown[], PostgrestQueryMock<T>>;
  insert: Mock<unknown[], PostgrestQueryMock<T>>;
  update: Mock<unknown[], PostgrestQueryMock<T>>;
  delete: Mock<unknown[], PostgrestQueryMock<T>>;
  eq: Mock<unknown[], PostgrestQueryMock<T> | Promise<PostgrestResponse<T>>>;
  neq: Mock<unknown[], Promise<PostgrestResponse<T>>>;
  is: Mock<unknown[], PostgrestQueryMock<T>>;
  ilike: Mock<unknown[], PostgrestQueryMock<T>>;
  order: Mock<unknown[], Promise<PostgrestResponse<T>>>;
  single: Mock<unknown[], Promise<PostgrestResponse<T>>>;
  limit: Mock<unknown[], PostgrestQueryMock<T>>;
}
