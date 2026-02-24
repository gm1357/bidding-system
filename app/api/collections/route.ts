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
      where: { deletedAt: null },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.collection.count({ where: { deletedAt: null } }),
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

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates = body as Record<string, unknown>;

  const { name, description, stock, price } = updates;

  if (typeof name !== 'string' || name.trim() === '') {
    return Response.json(
      { error: 'name is required and must be a non-empty string' },
      { status: 400 },
    );
  }

  if (typeof description !== 'string' || description.trim() === '') {
    return Response.json(
      { error: 'description is required and must be a non-empty string' },
      { status: 400 },
    );
  }

  if (!Number.isInteger(stock) || (stock as number) < 0) {
    return Response.json(
      { error: 'stock is required and must be a non-negative integer' },
      { status: 400 },
    );
  }

  if (!Number.isInteger(price) || (price as number) < 0) {
    return Response.json(
      { error: 'price is required and must be a non-negative integer' },
      { status: 400 },
    );
  }

  const collection = await prisma.collection.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      stock: stock as number,
      price: price as number,
    },
  });

  return Response.json(collection, { status: 201 });
}
