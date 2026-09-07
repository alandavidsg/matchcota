'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle, X } from 'lucide-react';

type Props = {
  mensaje: string;
  detalle?: string;
  onClose: () => void;
  /** Milisegundos antes de cerrarse solo. 0 lo deja fijo hasta que lo cierren. */
  duracion?: number;
};

/**
 * Aviso flotante de confirmación.
 *
 * Va anclado al viewport, no al documento, así que se ve aunque la persona
 * haya quedado al final de un formulario largo — que es justo el caso donde
 * el aviso dentro de la página pasaba desapercibido.
 *
 * Se ancla ARRIBA a propósito: abajo compiten la barra de navegación móvil y
 * el botón flotante de "Ayúdanos a mejorar". Y va por encima de ese botón
 * (z-1100) porque es una respuesta directa a algo que la persona acaba de hacer.
 */
export default function Toast({ mensaje, detalle, onClose, duracion = 5000 }: Props) {
  // `onClose` suele llegar como función nueva en cada render del padre. Si el
  // temporizador dependiera de ella, cada re-render lo reiniciaría y el aviso
  // podría no cerrarse nunca. Se guarda en una ref para que el timeout se arme
  // una sola vez.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!duracion) return;
    const t = setTimeout(() => onCloseRef.current(), duracion);
    return () => clearTimeout(t);
  }, [duracion]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-in fixed z-[1200] top-4 left-3 right-3 md:left-auto md:right-6 md:top-6 md:w-96"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 flex items-start gap-3">
        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1a1a2e]">{mensaje}</p>
          {detalle && <p className="text-xs text-gray-400 mt-0.5">{detalle}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="shrink-0 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
