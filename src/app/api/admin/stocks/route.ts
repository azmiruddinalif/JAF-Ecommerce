import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getPaginatedProductStocks } from "@/lib/data/products";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? "10") || 10;
  const category = searchParams.get("category") ?? "__all__";
  const statusParam = searchParams.get("status") ?? "all";
  const status =
    statusParam === "in" || statusParam === "low" || statusParam === "out"
      ? statusParam
      : "all";
  const search = searchParams.get("search") ?? "";
  const sortParam = searchParams.get("sortBy") ?? "default";
  const sortBy =
    sortParam === "stock-asc" || sortParam === "stock-desc" || sortParam === "name-asc"
      ? sortParam
      : "default";

  const data = await getPaginatedProductStocks({
    page,
    pageSize,
    category,
    status,
    search,
    sortBy,
  });

  return NextResponse.json(data);
}

