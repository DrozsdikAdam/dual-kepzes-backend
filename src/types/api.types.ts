export interface ApiResponse<T = any> {
     success: boolean;
     data?: T;
     message?: string;
     error?: ApiError;
}

export interface ApiError {
     code: string;
     message: string;
     details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
     data: T[];
     pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
     };
}
