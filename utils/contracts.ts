export type ApiResponse<T> = { success: true; data: T };
export type Pagination = { limit: number; hasMore: boolean; nextCursor: string | null };
export type ApiPage<T> = ApiResponse<T[]> & { pagination: Pagination };
export type DirectoryUser = { userId: string; firstName: string; lastName: string; username: string };
export type Profile = DirectoryUser & {
  email: string; isActive: boolean; contact: string; language: 'Sinhala' | 'Tamil'; boatId: string;
};

export const readPage = <T>(value: ApiPage<T>): ApiPage<T> => {
  const page = value?.pagination;
  if (value?.success !== true || !Array.isArray(value.data) || !page ||
      !Number.isInteger(page.limit) || page.limit < 1 || page.limit > 50 ||
      typeof page.hasMore !== 'boolean' || value.data.length > page.limit ||
      (page.hasMore ? !value.data.length || typeof page.nextCursor !== 'string' || !/^[a-f\d]{24}$/i.test(page.nextCursor)
        : page.nextCursor !== null)) {
    throw new Error('Invalid paginated API response');
  }
  return value;
};

export const mergeItems = <T>(existing: T[], incoming: T[], key: (item: T) => string): T[] => {
  const items = new Map(existing.map(item => [key(item), item]));
  for (const item of incoming) items.set(key(item), item);
  return [...items.values()];
};
