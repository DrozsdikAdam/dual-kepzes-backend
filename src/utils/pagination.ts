export interface PaginationParams {
     page?: number;
     limit?: number;
}

export interface PaginationResult<T> {
     data: T[];
     pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
     };
}

export function getPaginationParams(query: any): Required<PaginationParams> {
     const page = Math.max(1, parseInt(query.page as string) || 1);
     const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));
     return { page, limit };
}

export function getPrismaSkipTake(params: Required<PaginationParams>) {
     return {
          skip: (params.page - 1) * params.limit,
          take: params.limit,
     };
}

export async function paginate<T>(
     params: Required<PaginationParams>,
     dataPromise: Promise<T[]>,
     countPromise: Promise<number>
): Promise<PaginationResult<T>> {
     const [data, total] = await Promise.all([dataPromise, countPromise]);

     return {
          data,
          pagination: {
               page: params.page,
               limit: params.limit,
               total,
               totalPages: Math.ceil(total / params.limit),
          },
     };
}
