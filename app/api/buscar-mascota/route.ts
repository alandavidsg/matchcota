import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../lib/rateLimit';
import { trackAiUsage } from '../../../lib/aiUsage';
import { supabaseAdmin } from '../../../lib/supabase-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_MODEL = 'qwen/qwen3.6-27b';

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

// Llama a Groq y, si choca con el rate limit (429), espera lo que Groq pide
// ("Please retry in X.Ys") y reintenta UNA vez. Cachear el catálogo de a poco
// (Promise.all en paralelo) puede disparar varias llamadas seguidas que, sumadas,
// superen las 8.000 tokens/minuto aunque cada una sea liviana; el retry evita que
// esa mascota se quede afuera del resultado solo por mala suerte de timing.
async function groqChatCompletion(body: object): Promise<Response> {
  const call = () =>
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const first = await call();
  if (first.status !== 429) return first;

  const errText = await first.text();
  const waitMatch = errText.match(/retry in ([\d.]+)s/i);
  const waitMs = Math.min(waitMatch ? Math.ceil(parseFloat(waitMatch[1]) * 1000) : 10_000, 25_000);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  return call();
}

// Analiza una foto (URL remota o data URI, Groq acepta ambas) y extrae tipo, raza,
// color y descripción. Se usa tanto para la foto de la mascota perdida como (una
// sola vez por mascota, con caché en `visual_description`) para el catálogo.
async function analyzePetImage(imageUrl: string): Promise<Analysis> {
  const response = await groqChatCompletion({
    model: GROQ_MODEL,
    reasoning_effort: 'none',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl } },
        {
          type: 'text',
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
    max_tokens: 400,
    temperature: 0.1,
  });

  if (!response.ok) {
    console.error('Groq analyzePetImage error:', response.status, await response.text());
    return { tipo: '', raza: '', color: '', descripcion: '' };
  }

  const result = await response.json();
  const text: string = result.choices?.[0]?.message?.content ?? '';
  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* empty */ }
  console.error('Groq analyzePetImage: no se pudo parsear JSON. Texto crudo:', text);
  return { tipo: '', raza: '', color: '', descripcion: '' };
}

// Genera y cachea la descripción visual de una mascota del catálogo (solo la primera
// vez que aparece en una búsqueda; de ahí en adelante se reusa desde la BD, sin
// volver a llamar a la IA por ella). Groq acepta la URL pública de Supabase Storage
// directo, no hace falta descargar los bytes como con Gemini.
async function getOrCreateVisualDescription(pet: Pet): Promise<string | null> {
  if (pet.visual_description) return pet.visual_description;

  const analysis = await analyzePetImage(pet.image);
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

  const response = await groqChatCompletion({
    model: GROQ_MODEL,
    reasoning_effort: 'none',
    messages: [{
      role: 'user',
      content: `Mascota buscada:\n"${searchedDescription}"\n\nCatálogo de mascotas candidatas:\n${catalogText}\n\nOrdena las mascotas candidatas por similitud visual con la mascota buscada, considerando color del pelaje, marcas, tamaño y características únicas descritas en el texto.\n\nResponde ÚNICAMENTE con JSON válido sin bloques de código:\n[{"id": <número>, "similitud": <0-100>, "razon": "<razón breve en español>"}]\nIncluye todas las mascotas candidatas.`,
    }],
    max_tokens: 800,
    temperature: 0.1,
  });

  if (!response.ok) {
    console.error('Groq rankByDescription error:', response.status, await response.text());
    return [];
  }

  const result = await response.json();
  const text: string = result.choices?.[0]?.message?.content ?? '';

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

  await trackAiUsage('groq_search');

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    // 1. Analizar la foto subida (1 llamada con imagen)
    const analysis = await analyzePetImage(imageBase64);
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
    // Secuencial, no Promise.all: si varias mascotas nunca fueron descritas (catálogo
    // "frío"), disparar todas las llamadas a Groq en paralelo revienta el límite de
    // 8.000 tokens/minuto de una sola vez aunque cada llamada individual sea liviana.
    // En régimen normal (descripción ya cacheada) esto no agrega latencia real.
    const withDescriptions: (Pet & { visual_description: string })[] = [];
    for (const pet of petsToCompare) {
      const description = await getOrCreateVisualDescription(pet);
      if (description) withDescriptions.push({ ...pet, visual_description: description });
    }

    // 5. Ranking visual por texto (1 sola llamada, sin imágenes de catálogo)
    const sorted = (await rankByDescription(analysis.descripcion, withDescriptions))
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, 6);

    return NextResponse.json({ matches: sorted, analysis });
  } catch (err) {
    console.error('buscar-mascota error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
