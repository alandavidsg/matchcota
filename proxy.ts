import { NextRequest, NextResponse } from 'next/server';
import { MODO_PRIVADO } from './lib/siteUrl';

// Los dominios públicos del sitio. Las URLs de pruebas NO van acá: esas quedan
// siempre detrás de la contraseña, también después del lanzamiento, para que el
// sitio viva en una sola dirección y el ensayo no se confunda con lo real.
const PUBLIC_HOSTS = ['matchcota.cl', 'www.matchcota.cl'];

export function proxy(req: NextRequest) {
  const host = req.headers.get('host')?.toLowerCase() ?? '';
  const { pathname } = req.nextUrl;

  // Assets y archivos estáticos pasan siempre
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // ── Dominio público
  if (PUBLIC_HOSTS.includes(host)) {
    // Lanzado: el proxy no se mete en nada. Las vistas de administración siguen
    // cerradas por su cuenta — cada route valida la cookie por dentro.
    if (!MODO_PRIVADO) return NextResponse.next();

    // Sin lanzar: todo se reescribe a /proximamente (la URL no cambia en la barra)
    if (pathname === '/proximamente') return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = '/proximamente';
    return NextResponse.rewrite(url);
  }

  // ── Resto de hosts (URLs de pruebas): muro de contraseña
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
