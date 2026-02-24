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

export interface BidBody {
  userId: string;
  price: number;
}

export interface BidPatchBody {
  price?: number;
}

import type { Collection, Bid } from '@/prisma/generated/prisma/client';
export type CollectionWithBids = Collection & { bids: Bid[] };
