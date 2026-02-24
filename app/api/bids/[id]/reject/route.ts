import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.bid.findUnique({ where: { id } });

  if (!existing || existing.deletedAt !== null) {
    return Response.json({ error: 'Bid not found' }, { status: 404 });
  }

  if (existing.status === 'REJECTED') {
    return Response.json({ error: 'Bid is already rejected' }, { status: 409 });
  }

  if (existing.status === 'ACCEPTED') {
    return Response.json(
      { error: 'An accepted bid cannot be rejected' },
      { status: 409 },
    );
  }

  const bid = await prisma.bid.update({
    where: { id },
    data: { status: 'REJECTED' },
  });

  return Response.json(bid);
}
