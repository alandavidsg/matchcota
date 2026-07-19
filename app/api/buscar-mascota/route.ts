import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '../../../lib/rateLimit';

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

// Paso 1: analiza la foto y extrae tipo, raza, color y descripción
async function analyzeLostPet(imageBase64: string): Promise<Analysis> {
  const match = imageBase64.match(/^data:(.+?);base64,(.+)$/);
  const mimeType = match?.[1] ?? 'image/jpeg';
  const data = match?.[2] ?? imageBase64;

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

  if (!response.ok) return { tipo: '', raza: '', color: '', descripcion: '' };

  const result = await response.json();
  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* empty */ }
  return { tipo: '', raza: '', color: '', descripcion: '' };
}

// Paso 2: ranking visual entre mascotas ya filtradas por raza/tipo
async function rankByVisualSimilarity(description: string, pets: Pet[]): Promise<Match[]> {
  if (pets.length === 0) return [];

  // Gemini necesita los bytes de cada foto (no acepta URLs remotas como Groq)
  const imagenes = await Promise.all(pets.map((pet) => fetchImageAsBase64(pet.image)));

  const parts: object[] = [
    {
      text: `Mascota buscada:\n"${description}"\n\nOrdena las siguientes fotos de mascotas por similitud visual con la descripción anterior. Considera color del pelaje, marcas, tamaño y características únicas.`,
    },
  ];

  pets.forEach((pet, i) => {
    const img = imagenes[i];
    if (!img) return; // foto no descargable, se omite de la comparación
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
    parts.push({ text: `Foto: ID=${pet.id}, Nombre="${pet.name}"` });
  });

  parts.push({
    text: `Responde ÚNICAMENTE con JSON válido sin bloques de código:
[{"id": <número>, "similitud": <0-100>, "razon": "<razón breve en español>"}]
Incluye todas las mascotas.`,
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
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

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    // 1. Analizar la foto subida
    const analysis = await analyzeLostPet(imageBase64);
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
      .select('id, name, type, breed, image, location')
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
    let breedMatches = allPets.filter((pet) => {
      const petBreed = pet.breed?.toLowerCase() ?? '';
      return razaKeywords.some((kw) => petBreed.includes(kw));
    });

    // Si no hay coincidencias por raza, usar todos los del mismo tipo.
    // Tope de mascotas a comparar visualmente (Gemini soporta bastantes imágenes por
    // request, pero se acota igual para no descargar/comparar catálogos enormes).
    const MAX_COMPARE = 18;
    const petsToCompare = (breedMatches.length > 0 ? breedMatches : allPets).slice(0, MAX_COMPARE);
    console.log(`Comparing against ${petsToCompare.length} pets (breed match: ${breedMatches.length})`);

    // 4. Ranking visual en lotes de 6
    const BATCH = 6;
    const allMatches: Match[] = [];
    for (let i = 0; i < petsToCompare.length; i += BATCH) {
      const batch = petsToCompare.slice(i, i + BATCH);
      const ranked = await rankByVisualSimilarity(analysis.descripcion, batch);
      allMatches.push(...ranked);
    }

    // 5. Ordenar y devolver top 6
    const sorted = allMatches.sort((a, b) => b.similitud - a.similitud).slice(0, 6);

    return NextResponse.json({ matches: sorted, analysis });
  } catch (err) {
    console.error('buscar-mascota error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
