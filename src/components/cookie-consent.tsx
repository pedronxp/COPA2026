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
      className="position-fixed bottom-0 end-0 p-3"
      style={{
        zIndex: 9999,
        maxWidth: '400px',
        width: 'calc(100% - 24px)',
        margin: '12px',
        animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        className="p-3 rounded-3 border shadow-lg"
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'rgba(30, 41, 59, 0.85)',
          color: '#f8fafc',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="d-flex flex-column gap-3">
          <div>
            <h6 className="d-flex align-items-center gap-2 mb-1 fw-bold text-neon-green" style={{ color: '#10b981', fontSize: '0.95rem' }}>
              <i className="bi bi-shield-check"></i>
              <span>Privacidade dos Seus Dados</span>
            </h6>
            <p className="small mb-0 text-secondary" style={{ color: '#94a3b8', lineHeight: '1.5', fontSize: '0.825rem' }}>
              Coletamos seu e-mail e senha apenas para login e acesso seguro ao bolão Copa dos Crias. 
              Estes dados <strong>não têm fins lucrativos</strong> e não são compartilhados. Suas senhas são criptografadas e seguras. Usamos cookies essenciais para manter você conectado.
            </p>
          </div>
          <div className="text-end">
            <button
              onClick={handleAccept}
              className="btn btn-sm w-100 fw-bold py-2"
              style={{
                backgroundColor: '#10b981',
                borderColor: '#10b981',
                color: '#080c14',
                borderRadius: '6px',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
                e.currentTarget.style.borderColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981';
                e.currentTarget.style.borderColor = '#10b981';
              }}
            >
              Entendi e Aceito
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
