import { prisma } from "@/lib/prisma";

export async function listForUser(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: { userId },
        select: { role: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return portfolios;
}

export async function createForUser(userId: string, name: string) {
  return prisma.portfolio.create({
    data: {
      name,
      members: {
        create: {
          role: "OWNER",
          user: {
            connect: { id: userId },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
}