import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const bid = await prisma.bid.findUnique({ where: { id } });

  if (!bid || bid.deletedAt !== null) {
    return Response.json({ error: 'Bid not found' }, { status: 404 });
  }

  return Response.json(bid);
}

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

  const existing = await prisma.bid.findUnique({ where: { id } });

  if (!existing || existing.deletedAt !== null) {
    return Response.json({ error: 'Bid not found' }, { status: 404 });
  }

  if (existing.status !== 'PENDING') {
    return Response.json(
      { error: 'Only PENDING bids can be updated' },
      { status: 409 },
    );
  }

  const bid = await prisma.bid.update({
    where: { id },
    data,
  });

  return Response.json(bid);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.bid.findUnique({ where: { id } });

  if (!existing || existing.deletedAt !== null) {
    return Response.json({ error: 'Bid not found' }, { status: 404 });
  }

  if (existing.status !== 'PENDING') {
    return Response.json(
      { error: 'Only PENDING bids can be deleted' },
      { status: 409 },
    );
  }

  await prisma.bid.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return new Response(null, { status: 204 });
}
