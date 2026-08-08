import { getAuthHandler } from "@/lib/auth/server";

type RouteContext = { params: Promise<{ path: string[] }> };

export function GET(request: Request, context: RouteContext) {
  return getAuthHandler().GET(request, context);
}

export function POST(request: Request, context: RouteContext) {
  return getAuthHandler().POST(request, context);
}
