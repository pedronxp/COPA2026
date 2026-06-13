'use client';

import { useEffect, useState } from 'react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar se o consentimento já foi dado no localStorage ou cookies
    const localConsent = localStorage.getItem('copa_crias_cookies_accepted');
    const cookieConsent = document.cookie
      .split('; ')
      .find((row) => row.startsWith('copa_crias_cookies_accepted='));

    if (!localConsent && !cookieConsent) {
      // Pequeno atraso para uma entrada mais suave e premium
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Salvar consentimento por 1 ano (365 dias) nos cookies
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `copa_crias_cookies_accepted=true; path=/; max-age=${maxAge}; SameSite=Lax; Secure=${process.env.NODE_ENV === 'production'}`;
    
    // Salvar também no localStorage para redundância
    localStorage.setItem('copa_crias_cookies_accepted', 'true');
    
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="position-fixed bottom-0 start-50 translate-middle-x w-100 p-3 p-md-4"
      style={{
        zIndex: 9999,
        maxWidth: '720px',
        animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        className="p-4 rounded-4 border shadow-lg"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'rgba(30, 41, 59, 0.8)',
          color: '#f8fafc',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
          <div className="flex-grow-1">
            <h5 className="d-flex align-items-center gap-2 mb-2 fw-bold" style={{ color: '#10b981' }}>
              <i className="bi bi-shield-lock-fill"></i>
              <span>Privacidade & Uso de Dados</span>
            </h5>
            <p className="small mb-0 text-secondary" style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              Coletamos seu e-mail e senha exclusivamente para fins de autenticação e acesso seguro ao sistema do bolão Copa dos Crias. 
              Estes dados <strong>não possuem fins lucrativos</strong>, não são vendidos ou compartilhados com terceiros e não temos acesso à sua senha (criptografada). 
              Usamos cookies essenciais para manter você conectado com segurança. Ao continuar no site, você aceita estas condições.
            </p>
          </div>
          <div className="d-flex align-items-center justify-content-end gap-2 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="btn px-4 py-2 fw-bold"
              style={{
                backgroundColor: '#10b981',
                borderColor: '#10b981',
                color: '#080c14',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
                e.currentTarget.style.borderColor = '#059669';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981';
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Entendi e Aceito
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 40px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}
