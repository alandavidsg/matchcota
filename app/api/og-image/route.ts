import { NextRequest, NextResponse } from 'next/server';

// Proxy que descarga la imagen original y la sirve con cache headers
// WhatsApp y scrapers la cargan desde este endpoint en vez del original (7MB)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url', { status: 400 });
  }

  // Solo permitir imágenes de Supabase del proyecto
  const allowedHost = 'zwvrutncspbqlsapsknd.supabase.co';
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (parsed.hostname !== allowedHost) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return new NextResponse('Image fetch failed', { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    });
  } catch {
    return new NextResponse('Error', { status: 500 });
  }
}
