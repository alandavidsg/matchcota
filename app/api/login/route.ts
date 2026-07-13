import { NextRequest, NextResponse } from 'next/server';

// La contraseña vive solo en la variable de entorno SITE_PASSWORD (el repo es público)
const PASSWORD = process.env.SITE_PASSWORD;

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!PASSWORD || password !== PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('matchcota_auth', 'ok', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/',
  });
  return res;
}
