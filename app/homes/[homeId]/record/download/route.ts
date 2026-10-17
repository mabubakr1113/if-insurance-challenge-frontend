import { NextResponse, type NextRequest } from 'next/server';
import { apiRaw, ApiError } from '@/lib/api';

/** Proxies the backend export so the API key stays on the server, keeping its file name. */
export async function GET(request: NextRequest, ctx: RouteContext<'/homes/[homeId]/record/download'>) {
  const { homeId } = await ctx.params;
  try {
    const res = await apiRaw(`/api/homes/${homeId}/export`);
    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
        'Content-Disposition': res.headers.get('Content-Disposition') ?? `attachment; filename="home-record.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      const path = `/homes/${homeId}/record`;
      if (err.status === 401 || err.code === 'removed') return NextResponse.redirect(new URL(`/demo/clear?next=${encodeURIComponent(path)}`, request.url));
      if (err.status === 403) return NextResponse.redirect(new URL('/forbidden', request.url));
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
