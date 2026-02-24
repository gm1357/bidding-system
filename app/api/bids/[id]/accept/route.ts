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

  if (existing.status === 'ACCEPTED') {
    return Response.json({ error: 'Bid is already accepted' }, { status: 409 });
  }

  if (existing.status === 'REJECTED') {
    return Response.json(
      { error: 'A rejected bid cannot be accepted' },
      { status: 409 },
    );
  }

  const [acceptedBid] = await prisma.$transaction([
    prisma.bid.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    }),
    prisma.bid.updateMany({
      where: {
        collectionId: existing.collectionId,
        id: { not: id },
        status: 'PENDING',
        deletedAt: null,
      },
      data: { status: 'REJECTED' },
    }),
  ]);

  return Response.json(acceptedBid);
}
