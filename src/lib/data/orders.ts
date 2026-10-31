import "server-only";
import { connection } from "next/server";
import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getAdminOrders(params: {
  page?: number;
  query?: string;
  status?: OrderStatus;
}) {
  await connection();
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.OrderWhereInput = {};

  if (params.status) where.status = params.status;
  if (params.query) {
    where.OR = [
      { orderNumber: { contains: params.query, mode: "insensitive" } },
      { customerName: { contains: params.query, mode: "insensitive" } },
      { customerPhone: { contains: params.query, mode: "insensitive" } },
    ];
  }

  try {
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, page, pageSize: 20, totalPages: Math.max(1, Math.ceil(total / 20)) };
  } catch {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
  }
}

export async function getOrderById(id: string) {
  await connection();
  try {
    return await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
    });
  } catch {
    return null;
  }
}

const REVENUE_STATUSES: OrderStatus[] = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getSalesOverview(days = 14) {
  await connection();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const buckets = new Map<string, { date: Date; totalCents: number; orderCount: number }>();
  for (let i = 0; i < days; i++) {
    const date = new Date(since);
    date.setDate(since.getDate() + i);
    buckets.set(dayKey(date), { date, totalCents: 0, orderCount: 0 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { in: REVENUE_STATUSES } },
      select: { createdAt: true, totalCents: true },
    });

    for (const order of orders) {
      const bucket = buckets.get(dayKey(order.createdAt));
      if (bucket) {
        bucket.totalCents += order.totalCents;
        bucket.orderCount += 1;
      }
    }
  } catch {
    // Return empty timeline if DB is offline
  }

  const series = Array.from(buckets.values());
  return {
    series,
    totalCents: series.reduce((sum, d) => sum + d.totalCents, 0),
    orderCount: series.reduce((sum, d) => sum + d.orderCount, 0),
  };
}

const STATUS_ORDER: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export async function getDashboardStats() {
  await connection();
  try {
    const [totalOrders, pendingOrders, revenueResult, totalProducts, lowStockCount, recentOrders, statusGroups] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.aggregate({
          _sum: { totalCents: true },
          where: { status: { in: REVENUE_STATUSES } },
        }),
        prisma.product.count(),
        prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
        prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      ]);

    const countByStatus = new Map(statusGroups.map((g) => [g.status, g._count._all]));
    const statusBreakdown = STATUS_ORDER.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    }));

    return {
      totalOrders,
      pendingOrders,
      revenueCents: revenueResult._sum.totalCents ?? 0,
      totalProducts,
      lowStockCount,
      recentOrders,
      statusBreakdown,
    };
  } catch {
    return {
      totalOrders: 0,
      pendingOrders: 0,
      revenueCents: 0,
      totalProducts: 0,
      lowStockCount: 0,
      recentOrders: [],
      statusBreakdown: STATUS_ORDER.map((status) => ({ status, count: 0 })),
    };
  }
}
