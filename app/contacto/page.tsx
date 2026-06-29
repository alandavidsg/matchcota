'use client';

import { useState } from 'react';
import { Mail, MessageCircle, MapPin, Clock, CheckCircle, Send } from 'lucide-react';

const contactItems = [
  { icon: <Mail size={20} className="text-orange-500" />, label: 'Email', value: 'hola@matchcota.cl' },
  { icon: <MessageCircle size={20} className="text-orange-500" />, label: 'WhatsApp', value: '+56 9 1234 5678' },
  { icon: <MapPin size={20} className="text-orange-500" />, label: 'Ubicación', value: 'Santiago, Chile' },
  { icon: <Clock size={20} className="text-orange-500" />, label: 'Horario', value: 'Lunes a Viernes 9:00 - 18:00' },
];

export default function Contacto() {
  const [sent, setSent] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#1a1a2e] px-8 py-20 text-center">
        <h1 className="text-white text-4xl font-semibold mb-4">Contacto</h1>
        <p className="text-white/50 text-base max-w-md mx-auto">
          Estamos aquí para ayudarte con cualquier consulta
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          {contactItems.map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                <div className="text-sm font-medium text-[#1a1a2e]">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {!sent ? (
            <>
              <h2 className="text-lg font-semibold text-[#1a1a2e] mb-5">Envíanos un mensaje</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Nombre</label>
                  <input type="text" placeholder="Tu nombre" className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400" style={{ fontSize: '16px' }} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Email</label>
                  <input type="email" placeholder="tu@email.com" className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400" style={{ fontSize: '16px' }} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Mensaje</label>
                  <textarea rows={4} placeholder="¿Cómo podemos ayudarte?" className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400 resize-none" style={{ fontSize: '16px' }} />
                </div>
                <button
                  onClick={() => setSent(true)}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Enviar mensaje
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4"><CheckCircle size={56} className="text-green-500" /></div>
              <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">Mensaje enviado</h3>
              <p className="text-gray-400 text-sm">Te responderemos a la brevedad.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
