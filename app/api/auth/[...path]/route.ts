import { getAuth } from "@/lib/auth/server";

type RouteContext = { params: Promise<{ path: string[] }> };

export function GET(request: Request, context: RouteContext) {
  return getAuth().handler().GET(request, context);
}

export function POST(request: Request, context: RouteContext) {
  return getAuth().handler().POST(request, context);
}
