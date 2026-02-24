export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CollectionBody {
  name: string;
  description: string;
  stock: number;
  price: number;
}

export interface CollectionPatchBody {
  name?: string;
  description?: string;
  stock?: number;
  price?: number;
}
