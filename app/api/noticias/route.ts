import { NextResponse } from 'next/server';

const CONSULTA = 'mascotas OR perros OR gatos OR adopcion animales';
const CUANTAS = 10;

type Articulo = {
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
};

// Quita acentos, mayúsculas y puntuación: así "Récord animal: tres perros..."
// y "Record animal - tres perros..." se reconocen como el mismo texto.
function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function traerPagina(apiKey: string, page: number): Promise<Articulo[]> {
  try {
    const res = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(CONSULTA)}&lang=es&max=10&page=${page}&apikey=${apiKey}`,
      { next: { revalidate: 3600 } } // cache 1 hora
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.articles) ? data.articles : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return NextResponse.json({ articles: [] });

  // Se piden dos páginas porque los repetidos se comen alrededor de un tercio de
  // la primera: los diarios de un mismo grupo republican la misma nota de
  // agencia y GNews la indexa una vez por diario.
  //
  // Van una después de otra, NO en paralelo: GNews bloquea las peticiones
  // simultáneas ("too many requests in a short period of time") y la segunda
  // volvería vacía casi siempre, dejando el filtro sin con qué rellenar. Si aun
  // así falla, seguimos con lo que haya traído la primera.
  const pagina1 = await traerPagina(apiKey, 1);
  const pagina2 = pagina1.length ? await traerPagina(apiKey, 2) : [];

  const titulosVistos = new Set<string>();
  const bajadasVistas = new Set<string>();
  const articles: Articulo[] = [];

  for (const art of [...pagina1, ...pagina2]) {
    const titulo = normalizar(art.title);
    if (!titulo || titulosVistos.has(titulo)) continue;

    // La bajada también se compara: el mismo cable a veces sale con el titular
    // cambiado pero el resumen palabra por palabra idéntico.
    const bajada = normalizar(art.description);
    if (bajada && bajadasVistas.has(bajada)) continue;

    titulosVistos.add(titulo);
    if (bajada) bajadasVistas.add(bajada);
    articles.push(art);

    if (articles.length === CUANTAS) break;
  }

  return NextResponse.json({ articles });
}
