import prisma from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  return Response.json(users);
}
