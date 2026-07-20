'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Lightbulb, X, CheckCircle } from 'lucide-react';

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // No mostrar el widget dentro del panel de refugios (tienen su propio flujo)
  if (pathname?.startsWith('/refugios/panel')) return null;

  const cerrar = () => {
    setOpen(false);
    setTimeout(() => {
      setSent(false);
      setMensaje('');
      setEmail('');
      setErrorMsg(null);
    }, 300);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, email, pagina: pathname }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error || 'Hubo un error al enviar. Intenta de nuevo.');
        return;
      }
      setSent(true);
    } catch {
      setErrorMsg('Hubo un error al enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 bottom-20 right-4 md:bottom-6 md:right-6 flex items-center gap-2 bg-[#1a1a2e] hover:bg-[#2a2a4a] text-white pl-3 pr-4 py-3 rounded-full shadow-lg transition"
        aria-label="Ayúdanos a mejorar"
      >
        <Lightbulb size={18} className="text-orange-400" />
        <span className="text-sm font-medium hidden sm:inline">Ayúdanos a mejorar</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#1a1a2e]">
                <Lightbulb size={18} className="text-orange-500" />
                <span className="font-semibold text-sm">Ayúdanos a mejorar</span>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5">
              {sent ? (
                <div className="text-center py-6">
                  <div className="flex justify-center mb-3"><CheckCircle size={48} className="text-green-500" /></div>
                  <h3 className="text-base font-semibold text-[#1a1a2e] mb-1">¡Gracias por tu idea!</h3>
                  <p className="text-gray-400 text-sm">La vamos a revisar con cariño.</p>
                </div>
              ) : (
                <form onSubmit={enviar} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">¿Qué podríamos mejorar?</label>
                    <textarea
                      rows={4}
                      required
                      minLength={5}
                      maxLength={2000}
                      placeholder="Cuéntanos una idea, algo que no funcionó bien, o lo que se te ocurra..."
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 resize-none text-sm"
                      style={{ fontSize: '16px' }}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Tu email (opcional, por si quieres que te respondamos)</label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  {errorMsg && <p className="text-sm text-red-500 text-center">{errorMsg}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold transition disabled:opacity-60"
                    style={{ minHeight: '48px', fontSize: '15px' }}
                  >
                    {sending ? 'Enviando...' : 'Enviar sugerencia'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
