import { NextRequest, NextResponse } from 'next/server';

// Dominios que deben mostrar la página "Próximamente" mientras el sitio no está listo.
// El resto (matchcotacl-alan-s-team.vercel.app) sigue mostrando la app completa para pruebas.
const COMING_SOON_HOSTS = ['matchcota.cl', 'www.matchcota.cl'];

export function proxy(req: NextRequest) {
  const host = req.headers.get('host')?.toLowerCase() ?? '';
  const { pathname } = req.nextUrl;

  const isComingSoonHost = COMING_SOON_HOSTS.includes(host);

  // Dejar pasar todo lo que no sea matchcota.cl, la propia página y los assets
  if (
    !isComingSoonHost ||
    pathname === '/proximamente' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // En matchcota.cl, todo se reescribe a /proximamente (la URL no cambia en la barra)
  const url = req.nextUrl.clone();
  url.pathname = '/proximamente';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
