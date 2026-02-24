import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: collectionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates = body as Record<string, unknown>;
  const { userId, price } = updates;

  if (typeof userId !== 'string' || userId.trim() === '') {
    return Response.json(
      { error: 'userId is required and must be a non-empty string' },
      { status: 400 },
    );
  }

  if (!Number.isInteger(price) || (price as number) < 0) {
    return Response.json(
      { error: 'price is required and must be a non-negative integer' },
      { status: 400 },
    );
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection || collection.deletedAt !== null) {
    return Response.json({ error: 'Collection not found' }, { status: 404 });
  }

  try {
    const bid = await prisma.bid.create({
      data: {
        collectionId,
        userId,
        price: price as number,
      },
    });

    return Response.json(bid, { status: 201 });
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === 'P2003') {
      return Response.json(
        { error: 'userId references a user that does not exist' },
        { status: 400 },
      );
    }
    throw err;
  }
}
