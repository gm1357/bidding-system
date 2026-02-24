import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates = body as Record<string, unknown>;

  const data: Record<string, unknown> = {};

  if ('name' in updates) {
    if (typeof updates.name !== 'string' || updates.name.trim() === '') {
      return Response.json(
        { error: 'name must be a non-empty string' },
        { status: 400 },
      );
    }
    data.name = updates.name.trim();
  }

  if ('description' in updates) {
    if (
      typeof updates.description !== 'string' ||
      updates.description.trim() === ''
    ) {
      return Response.json(
        { error: 'description must be a non-empty string' },
        { status: 400 },
      );
    }
    data.description = updates.description.trim();
  }

  if ('stock' in updates) {
    if (!Number.isInteger(updates.stock) || (updates.stock as number) < 0) {
      return Response.json(
        { error: 'stock must be a non-negative integer' },
        { status: 400 },
      );
    }
    data.stock = updates.stock;
  }

  if ('price' in updates) {
    if (!Number.isInteger(updates.price) || (updates.price as number) < 0) {
      return Response.json(
        { error: 'price must be a non-negative integer' },
        { status: 400 },
      );
    }
    data.price = updates.price;
  }

  if (Object.keys(data).length === 0) {
    return Response.json(
      { error: 'At least one field must be provided to update' },
      { status: 400 },
    );
  }

  const existing = await prisma.collection.findUnique({ where: { id } });

  if (!existing || existing.deletedAt !== null) {
    return Response.json({ error: 'Collection not found' }, { status: 404 });
  }

  const collection = await prisma.collection.update({
    where: { id },
    data,
  });

  return Response.json(collection, { status: 200 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.collection.findUnique({ where: { id } });

  if (!existing || existing.deletedAt !== null) {
    return Response.json({ error: 'Collection not found' }, { status: 404 });
  }

  await prisma.collection.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return new Response(null, { status: 204 });
}
