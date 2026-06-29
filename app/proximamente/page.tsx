import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Matchcota · Próximamente',
  description: 'Estamos preparando algo especial para conectar mascotas con su hogar para siempre. 🐾',
  openGraph: {
    title: 'Matchcota · Próximamente',
    description: 'Estamos preparando algo especial para conectar mascotas con su hogar para siempre. 🐾',
    siteName: 'Matchcota',
    locale: 'es_CL',
    type: 'website',
  },
};

export default function ProximamentePage() {
  return (
    <main className="proximamente-root">
      <style>{`
        .proximamente-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          overflow: hidden;
          background:
            radial-gradient(1200px 600px at 50% -10%, #2a2a4a 0%, transparent 60%),
            linear-gradient(160deg, #1a1a2e 0%, #15152a 55%, #101022 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          padding: 24px;
        }
        .proximamente-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.28;
          z-index: 0;
        }
        .proximamente-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg, rgba(26,26,46,0.7) 0%, rgba(21,21,42,0.55) 45%, rgba(16,16,34,0.85) 100%);
        }
        .proximamente-glow {
          position: absolute;
          width: 520px; height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,108,0,0.22) 0%, transparent 70%);
          filter: blur(20px);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          animation: pulse 6s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.12); }
        }
        .paw {
          position: absolute;
          font-size: 26px;
          opacity: 0.07;
          z-index: 1;
          animation: float 14s linear infinite;
          user-select: none;
        }
        @keyframes float {
          0%   { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.1; }
          90%  { opacity: 0.1; }
          100% { transform: translateY(-15vh) rotate(40deg); opacity: 0; }
        }
        .proximamente-card {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 560px;
        }
        .proximamente-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(232,108,0,0.12);
          border: 1px solid rgba(232,108,0,0.35);
          color: #ffb877;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          padding: 7px 16px;
          border-radius: 999px;
          margin-bottom: 28px;
          text-transform: uppercase;
        }
        .proximamente-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #e86c00;
          box-shadow: 0 0 0 0 rgba(232,108,0,0.7);
          animation: blink 1.6s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,108,0,0.7); }
          50% { box-shadow: 0 0 0 7px rgba(232,108,0,0); }
        }
        .proximamente-logo {
          font-size: clamp(44px, 11vw, 76px);
          font-weight: 800;
          letter-spacing: -1.5px;
          margin: 0 0 6px;
          line-height: 1;
        }
        .proximamente-logo span { color: #e86c00; }
        .proximamente-paw-emoji {
          font-size: clamp(48px, 12vw, 72px);
          display: block;
          margin-bottom: 18px;
          animation: wiggle 3.5s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        .proximamente-tagline {
          font-size: clamp(16px, 4vw, 19px);
          color: #c9c9da;
          line-height: 1.55;
          margin: 18px auto 34px;
          max-width: 430px;
        }
        .proximamente-socials {
          display: flex;
          gap: 14px;
          justify-content: center;
          align-items: center;
        }
        .proximamente-socials a {
          color: #9a9ab0;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 9px 18px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          transition: all 0.2s ease;
        }
        .proximamente-socials a:hover {
          color: #fff;
          border-color: rgba(232,108,0,0.6);
          background: rgba(232,108,0,0.1);
        }
        .proximamente-foot {
          margin-top: 40px;
          font-size: 12px;
          color: #5a5a72;
        }
      `}</style>

      {/* Video de fondo en loop */}
      <video
        className="proximamente-video"
        src="/proximamente.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="proximamente-overlay" />

      <div className="proximamente-glow" />

      {/* Huellas flotando */}
      <span className="paw" style={{ left: '8%', animationDelay: '0s' }}>🐾</span>
      <span className="paw" style={{ left: '22%', animationDelay: '3s', fontSize: '34px' }}>🐾</span>
      <span className="paw" style={{ left: '40%', animationDelay: '6s' }}>🐾</span>
      <span className="paw" style={{ left: '58%', animationDelay: '1.5s', fontSize: '20px' }}>🐾</span>
      <span className="paw" style={{ left: '72%', animationDelay: '4.5s', fontSize: '38px' }}>🐾</span>
      <span className="paw" style={{ left: '88%', animationDelay: '8s' }}>🐾</span>

      <div className="proximamente-card">
        <span className="proximamente-badge">
          <span className="proximamente-dot" /> Próximamente
        </span>

        <span className="proximamente-paw-emoji">🐾</span>
        <h1 className="proximamente-logo">Match<span>cota</span></h1>

        <p className="proximamente-tagline">
          Estamos preparando algo especial para conectar mascotas
          con su hogar para siempre. Muy pronto vas a poder encontrar
          a tu compañero ideal. 🧡
        </p>

        <div className="proximamente-socials">
          <a href="https://www.instagram.com/matchcotacl/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.tiktok.com/@matchcotacl" target="_blank" rel="noopener noreferrer">TikTok</a>
        </div>

        <p className="proximamente-foot">© 2026 Matchcota · Adopción de mascotas en Chile</p>
      </div>
    </main>
  );
}
