import { NextRequest, NextResponse } from 'next/server';

// matchcota.cl muestra la página "Próximamente" al público.
// Cualquier otro host (URL de pruebas *.vercel.app) exige la contraseña del sitio.
const COMING_SOON_HOSTS = ['matchcota.cl', 'www.matchcota.cl'];

export function proxy(req: NextRequest) {
  const host = req.headers.get('host')?.toLowerCase() ?? '';
  const { pathname } = req.nextUrl;

  // Assets y archivos estáticos pasan siempre
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // ── matchcota.cl: todo se reescribe a /proximamente (la URL no cambia en la barra)
  if (COMING_SOON_HOSTS.includes(host)) {
    if (pathname === '/proximamente') return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = '/proximamente';
    return NextResponse.rewrite(url);
  }

  // ── Resto de hosts: muro de contraseña (modo privado)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/refugios') // el panel tiene su propia autenticación
  ) {
    return NextResponse.next();
  }

  const auth = req.cookies.get('matchcota_auth');
  if (auth?.value === 'ok') {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
