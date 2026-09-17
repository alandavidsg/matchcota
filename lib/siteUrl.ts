// ── El interruptor del lanzamiento ──────────────────────────────────────────
// En true el sitio todavía no se lanza. Lo leen dos cosas: proxy.ts, que decide
// si matchcota.cl muestra "Próximamente", y SITE_URL acá abajo, que es la
// dirección con la que se arman los enlaces que salen por correo.
//
// El día del lanzamiento se pone en false, y eso es todo el trámite. Antes eran
// cinco ediciones en cuatro archivos y una trampa: sacar el dominio de la lista
// de proxy.ts no lo dejaba público, lo mandaba al muro de contraseña.
export const MODO_PRIVADO = true;

// Dirección pública del sitio. Mientras dure el modo privado apunta a la URL de
// pruebas, porque un enlace a matchcota.cl hoy solo lleva a "Próximamente".
export const SITE_URL = MODO_PRIVADO
  ? 'https://matchcotacl-alan-s-team.vercel.app'
  : 'https://matchcota.cl';
