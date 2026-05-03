'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    category: 'Adopción',
    items: [
      {
        q: '¿Cómo puedo adoptar una mascota?',
        a: 'Entra al catálogo, elige la mascota que te interese y haz clic en "Quiero adoptar". Completa el formulario con tus datos y nos pondremos en contacto contigo para coordinar el proceso.',
      },
      {
        q: '¿Tiene algún costo adoptar?',
        a: 'No, la adopción es completamente gratuita. PetMatch es una plataforma sin fines de lucro. Si quieres apoyar nuestra causa, puedes hacer una donación voluntaria.',
      },
      {
        q: '¿Cuánto demora el proceso de adopción?',
        a: 'Una vez enviada tu solicitud, nos contactamos contigo en un plazo de 24 a 48 horas para coordinar el encuentro con la mascota y confirmar la adopción.',
      },
      {
        q: '¿Puedo adoptar si vivo en departamento?',
        a: 'Sí, puedes adoptar viviendo en departamento. Te pedimos que seas honesto en el formulario sobre tu tipo de vivienda para encontrar la mascota que mejor se adapte a tu estilo de vida.',
      },
    ],
  },
  {
    category: 'Reportar mascotas',
    items: [
      {
        q: '¿Qué pasa después de que reporto una mascota?',
        a: 'La mascota queda publicada en el catálogo con su ubicación y características detectadas por la IA. Cualquier persona interesada puede solicitar su adopción desde ese momento.',
      },
      {
        q: '¿La IA siempre detecta bien la raza?',
        a: 'La IA hace una estimación basada en la foto. Puede no ser 100% exacta, especialmente con mascotas mestizas o con fotos de baja calidad. Siempre puedes corregir los datos antes de publicar.',
      },
      {
        q: '¿Puedo reportar cualquier tipo de animal?',
        a: 'Sí, puedes reportar perros, gatos, pájaros, conejos y otros animales. Nuestro objetivo es ayudar a todo tipo de mascotas que estén en situación de calle o necesiten un hogar.',
      },
    ],
  },
  {
    category: 'Mascotas perdidas',
    items: [
      {
        q: '¿Cómo busco a mi mascota perdida?',
        a: 'Ve a la sección "Perdidos", sube una foto de tu mascota y nuestra IA la comparará visualmente con todas las mascotas del catálogo para encontrar posibles coincidencias.',
      },
      {
        q: '¿Cómo funciona la recompensa?',
        a: 'Al reportar tu mascota como perdida puedes indicar un monto de recompensa en pesos chilenos. Este monto es informativo y el pago se coordina directamente entre las personas involucradas.',
      },
      {
        q: '¿Qué hago si encuentro una mascota perdida?',
        a: 'Puedes buscarla en la sección "Perdidos" para ver si alguien la reportó, o reportarla en el catálogo general para que su dueño pueda encontrarla. También puedes contactarnos directamente.',
      },
    ],
  },
  {
    category: 'Donaciones',
    items: [
      {
        q: '¿A dónde va mi donación?',
        a: 'Tu donación se destina directamente a cubrir gastos veterinarios, alimentación y transporte de mascotas rescatadas mientras esperan ser adoptadas.',
      },
      {
        q: '¿Puedo donar sin MercadoPago?',
        a: 'Sí, también aceptamos transferencias bancarias. En la página de donaciones encontrarás los datos bancarios para realizar tu transferencia y el correo donde enviar el comprobante.',
      },
      {
        q: '¿Las donaciones tienen boleta o recibo?',
        a: 'Por el momento no emitimos boletas tributarias. Si realizas una transferencia y necesitas un comprobante, escríbenos a donaciones@petmatch.cl y te lo enviamos.',
      },
    ],
  },
  {
    category: 'Sobre PetMatch',
    items: [
      {
        q: '¿PetMatch tiene app móvil?',
        a: 'Aún no contamos con una app nativa, pero nuestro sitio está optimizado para móviles y funciona como una app desde el navegador. Puedes agregarlo a tu pantalla de inicio para acceso rápido.',
      },
      {
        q: '¿En qué regiones de Chile opera?',
        a: 'PetMatch opera en todo Chile. Puedes filtrar por región en el catálogo para ver mascotas cerca de ti, desde Arica y Parinacota hasta Magallanes.',
      },
      {
        q: '¿Cómo puedo contactarlos?',
        a: 'Puedes escribirnos a través de la sección Contacto del sitio o directamente al correo contacto@petmatch.cl. También estamos en Instagram, Facebook y TikTok.',
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-[#1a1a2e]">{q}</span>
        <ChevronDown
          size={18}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#1a1a2e] px-8 py-20 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center">
            <HelpCircle size={28} className="text-orange-400" />
          </div>
        </div>
        <h1 className="text-white text-4xl font-semibold mb-3">Preguntas frecuentes</h1>
        <p className="text-white/50 text-base max-w-md mx-auto">
          Todo lo que necesitas saber sobre PetMatch
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-14">
        {faqs.map((section) => (
          <div key={section.category} className="mb-8">
            <h2 className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3">
              {section.category}
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 px-6">
              {section.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
