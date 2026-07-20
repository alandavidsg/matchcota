import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../lib/rateLimit';
import { trackAiUsage } from '../../../lib/aiUsage';
import { supabaseAdmin } from '../../../lib/supabase-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = 'gemini-3.5-flash';

// Descarga una imagen por URL y la convierte a base64 para mandarla inline a Gemini
// (a diferencia de Groq, la API de Gemini no puede descargar URLs remotas, necesita los bytes).
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();
    return { data: Buffer.from(buffer).toString('base64'), mimeType };
  } catch {
    return null;
  }
}

type Pet = {
  id: number;
  name: string;
  type: string;
  breed: string;
  image: string;
  location: string;
  visual_description: string | null;
};

type Match = Pet & { similitud: number; razon: string };

// La IA a veces devuelve el nombre de la raza en español y la BD lo tiene en inglés (o viceversa).
// Sinónimos de razas comunes para que el filtro por palabra clave encuentre ambas variantes.
const RAZA_SINONIMOS: Record<string, string[]> = {
  caniche: ['poodle'],
  poodle: ['caniche'],
  pastor: ['shepherd'],
  shepherd: ['pastor'],
  salchicha: ['dachshund', 'teckel'],
  dachshund: ['salchicha', 'teckel'],
  teckel: ['salchicha', 'dachshund'],
  bulldog: ['bulldog'],
  chihuahua: ['chihuahua'],
  labrador: ['labrador'],
  husky: ['husky'],
};

function expandirSinonimos(keywords: string[]): string[] {
  const expandido = new Set(keywords);
  for (const kw of keywords) {
    (RAZA_SINONIMOS[kw] ?? []).forEach((s) => expandido.add(s));
  }
  return [...expandido];
}

type Analysis = {
  tipo: string;
  raza: string;
  color: string;
  descripcion: string;
};

// Analiza una foto (bytes ya descargados) y extrae tipo, raza, color y descripción.
// Se usa tanto para la foto de la mascota perdida como (una sola vez por mascota,
// con caché en `visual_description`) para el catálogo.
async function analyzePetImage(data: string, mimeType: string): Promise<Analysis> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data } },
            {
              text: `Analiza esta mascota y responde ÚNICAMENTE con JSON válido sin texto adicional:
{
  "tipo": "Perro" o "Gato" u otro tipo,
  "raza": "nombre exacto de la raza en español, ej: Husky Siberiano, Golden Retriever, Mestizo",
  "color": "colores principales del pelaje",
  "descripcion": "descripción visual detallada en 2-3 oraciones: raza, color, marcas distintivas, tamaño, características únicas"
}`,
            },
          ],
        }],
        generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    }
  );

  if (!response.ok) {
    console.error('Gemini analyzePetImage error:', response.status, await response.text());
    return { tipo: '', raza: '', color: '', descripcion: '' };
  }

  const result = await response.json();
  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* empty */ }
  console.error('Gemini analyzePetImage: no se pudo parsear JSON. Texto crudo:', text);
  return { tipo: '', raza: '', color: '', descripcion: '' };
}

// Genera y cachea la descripción visual de una mascota del catálogo (solo la primera
// vez que aparece en una búsqueda; de ahí en adelante se reusa desde la BD, sin
// volver a descargar la foto ni a llamar a Gemini por ella).
async function getOrCreateVisualDescription(pet: Pet): Promise<string | null> {
  if (pet.visual_description) return pet.visual_description;

  const img = await fetchImageAsBase64(pet.image);
  if (!img) return null;

  const analysis = await analyzePetImage(img.data, img.mimeType);
  if (!analysis.descripcion) return null;

  await supabaseAdmin.from('mascotas').update({ visual_description: analysis.descripcion }).eq('id', pet.id);
  return analysis.descripcion;
}

// Ranking visual por texto: compara la descripción de la mascota buscada contra las
// descripciones ya cacheadas del catálogo. Una sola llamada de texto (sin imágenes)
// para todo el lote, en vez de re-enviar cada foto en cada búsqueda.
async function rankByDescription(searchedDescription: string, pets: Pet[]): Promise<Match[]> {
  if (pets.length === 0) return [];

  const catalogText = pets
    .map((p) => `ID=${p.id} | Nombre="${p.name}" | Descripción: ${p.visual_description}`)
    .join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Mascota buscada:\n"${searchedDescription}"\n\nCatálogo de mascotas candidatas:\n${catalogText}\n\nOrdena las mascotas candidatas por similitud visual con la mascota buscada, considerando color del pelaje, marcas, tamaño y características únicas descritas en el texto.\n\nResponde ÚNICAMENTE con JSON válido sin bloques de código:\n[{"id": <número>, "similitud": <0-100>, "razon": "<razón breve en español>"}]\nIncluye todas las mascotas candidatas.`,
          }],
        }],
        generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    }
  );

  if (!response.ok) return [];

  const result = await response.json();
  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = clean.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const results = JSON.parse(jsonMatch[0]) as { id: number; similitud: number; razon: string }[];
    return results
      .map((r) => {
        const pet = pets.find((p) => p.id === r.id);
        if (!pet) return null;
        return { ...pet, similitud: r.similitud, razon: r.razon };
      })
      .filter((r): r is Match => r !== null);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed } = rateLimit(ip, 5); // 5 búsquedas por minuto por IP
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas búsquedas. Espera un momento antes de intentarlo de nuevo.' },
      { status: 429 }
    );
  }

  await trackAiUsage('gemini_search');

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    // 1. Analizar la foto subida (1 llamada a Gemini con imagen)
    const match = imageBase64.match(/^data:(.+?);base64,(.+)$/);
    const mimeType = match?.[1] ?? 'image/jpeg';
    const data = match?.[2] ?? imageBase64;
    const analysis = await analyzePetImage(data, mimeType);
    console.log('Analysis:', analysis);

    if (!analysis.tipo && !analysis.raza) {
      return NextResponse.json({ matches: [], analysis });
    }

    // 2. Buscar en catálogo por raza (principal) y/o tipo (fallback)
    //    Extrae palabras clave de la raza para buscar variantes (+ sinónimos ES/EN)
    const razaKeywords = expandirSinonimos(
      analysis.raza
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 3) // palabras significativas
    );

    let query = supabase
      .from('mascotas')
      .select('id, name, type, breed, image, location, visual_description')
      .eq('available', true)
      .not('image', 'is', null);

    // Filtrar por tipo primero (Perro, Gato, etc.)
    if (analysis.tipo) {
      query = query.ilike('type', `%${analysis.tipo}%`);
    }

    const { data: allPets } = await query;
    if (!allPets || allPets.length === 0) {
      return NextResponse.json({ matches: [], analysis });
    }

    // 3. Filtrar por raza usando coincidencia de palabras clave
    const breedMatches = allPets.filter((pet) => {
      const petBreed = pet.breed?.toLowerCase() ?? '';
      return razaKeywords.some((kw) => petBreed.includes(kw));
    });

    // Si no hay coincidencias por raza, usar todos los del mismo tipo.
    // Tope de mascotas a comparar visualmente para no descargar/comparar catálogos enormes.
    const MAX_COMPARE = 18;
    const petsToCompare = (breedMatches.length > 0 ? breedMatches : allPets).slice(0, MAX_COMPARE);
    console.log(`Comparing against ${petsToCompare.length} pets (breed match: ${breedMatches.length})`);

    // 4. Asegurar que cada mascota candidata tenga descripción visual cacheada
    //    (solo genera+guarda la que falte; las ya cacheadas no vuelven a costar nada).
    const withDescriptions = (
      await Promise.all(
        petsToCompare.map(async (pet) => {
          const description = await getOrCreateVisualDescription(pet);
          return description ? { ...pet, visual_description: description } : null;
        })
      )
    ).filter((p): p is Pet & { visual_description: string } => p !== null);

    // 5. Ranking visual por texto (1 sola llamada a Gemini, sin imágenes de catálogo)
    const sorted = (await rankByDescription(analysis.descripcion, withDescriptions))
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, 6);

    return NextResponse.json({ matches: sorted, analysis });
  } catch (err) {
    console.error('buscar-mascota error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
