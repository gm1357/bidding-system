import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { PaginatedResponse } from '@/lib/types';
import { Collection } from '@/prisma/generated/prisma/client';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Math.max(
    DEFAULT_PAGE,
    Number(searchParams.get('page') ?? DEFAULT_PAGE),
  );
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE)),
  );

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.collection.count(),
  ]);

  const response: PaginatedResponse<Collection> = {
    data: collections,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };

  return Response.json(response);
}
