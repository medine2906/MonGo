import React, { useState, useEffect, useRef } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { UserProfile }   from './components/UserProfile';
import { MapView }       from './components/MapView';
import { CollectorPanel } from './components/CollectorPanel';
import { ValidatorPanel } from './components/ValidatorPanel';
import { HowItWorks }    from './components/HowItWorks';
import { WalletState, UserRole, ContainerLocation } from './types';
import './styles/global.css';

type ActiveTab = 'map' | 'collector' | 'validator';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const App: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>({ address: null, isConnected: false, chainId: null });
  const [userRole,    setUserRole]    = useState<UserRole | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<ContainerLocation | null>(null);
  const [activeTab,   setActiveTab]   = useState<ActiveTab>('map');

  const tokenomicsRef = useReveal();

  const handleLocationSelect = (loc: ContainerLocation) => {
    setSelectedLoc(loc);
    if (userRole === 'collector') setActiveTab('collector');
  };

  return (
    <div className="app-root">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-mark">
            <div className="brand-mark-inner" />
          </div>
          <div className="brand-text">
            <span className="brand-name">MONECO</span>
            <span className="brand-tagline">Proof of Image Protocol</span>
          </div>
        </div>
        <nav className="header-nav">
          <a href="https://docs.monad.xyz" target="_blank" rel="noreferrer">Docs</a>
          <a href="https://monad.xyz"       target="_blank" rel="noreferrer">Monad</a>
        </nav>
        <WalletConnect walletState={walletState} setWalletState={setWalletState} />
      </header>

      {walletState.isConnected && walletState.address ? (
        /* ── Bağlı: harita tam ekran, paneller float ─────── */
        <div className="app-body">
          <div className="map-full">
            <MapView onLocationSelect={handleLocationSelect} selectedLocation={selectedLoc} />
          </div>

          <aside className="floating-sidebar">
            <UserProfile
              address={walletState.address}
              userRole={userRole}
              setUserRole={setUserRole}
            />

            {userRole && (
              <nav className="tab-nav">
                <button
                  className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                  onClick={() => setActiveTab('map')}
                >
                  <span className="tab-btn-dot" />
                  Harita
                </button>
                {userRole === 'collector' && (
                  <button
                    className={`tab-btn ${activeTab === 'collector' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collector')}
                  >
                    <span className="tab-btn-dot" />
                    Fotoğraf Yükle
                    {selectedLoc && <span className="tab-dot" />}
                  </button>
                )}
                {userRole === 'validator' && (
                  <button
                    className={`tab-btn ${activeTab === 'validator' ? 'active' : ''}`}
                    onClick={() => setActiveTab('validator')}
                  >
                    <span className="tab-btn-dot" />
                    Doğrula
                    <span className="tab-badge">3</span>
                  </button>
                )}
              </nav>
            )}

            <div className="sidebar-tip">
              <h4>Nasıl Çalışır?</h4>
              {userRole === 'collector' && (
                <ol>
                  <li>Yeşil noktayı seçin (yüksek ödül)</li>
                  <li>Yerinde fotoğraf çekin</li>
                  <li>Fotoğraf Yükle ile gönderin</li>
                  <li>AI + doğrulayıcı onayı bekleyin</li>
                  <li>Ödülünüzü kazanın</li>
                </ol>
              )}
              {userRole === 'validator' && (
                <ol>
                  <li>Doğrula panelini açın</li>
                  <li>Fotoğrafı dikkatlice inceleyin</li>
                  <li>Gerçek/Sahte oyunu kullanın</li>
                  <li>Çoğunlukla doğru oy → ödül</li>
                </ol>
              )}
              {!userRole && <p>Sol panelden kayıt olun.</p>}
            </div>
          </aside>

          {activeTab === 'collector' && userRole === 'collector' && (
            <div className="floating-panel">
              <CollectorPanel selectedLocation={selectedLoc} walletAddress={walletState.address} />
            </div>
          )}
          {activeTab === 'validator' && userRole === 'validator' && (
            <div className="floating-panel">
              <ValidatorPanel walletAddress={walletState.address} />
            </div>
          )}
        </div>

      ) : (
        /* ── Landing ─────────────────────────────────────── */
        <div className="landing">
          {/* Hero */}
          <div className="landing-hero">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              DePIN × Monad Blockchain
            </div>
            <h1>Çevreyi Belgele,<br />Token Kazan</h1>
            <p className="hero-sub">
              Çöp konteynerleri ve atık alanlarını fotoğraflayın.
              <br />
              Merkeziyetsiz <strong>Proof of Image</strong> protokolüyle ödüllendirilip seviye atlayın.
            </p>
            <WalletConnect walletState={walletState} setWalletState={setWalletState} />
            <div className="scroll-hint">
              <span>Keşfet</span>
              <div className="scroll-arrow" />
            </div>
          </div>

          {/* Hero → HowItWorks geçiş */}
          <div className="section-wave">
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#07070f" />
            </svg>
          </div>

          {/* Interactive How It Works */}
          <HowItWorks />

          {/* HowItWorks → Tokenomics geçiş */}
          <div style={{ lineHeight: 0, background: '#07070f' }}>
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 60, display: 'block' }}>
              <path d="M0,40 C360,0 1080,80 1440,40 L1440,80 L0,80 Z" fill="var(--white)" />
            </svg>
          </div>

          {/* Tokenomics */}
          <div className="landing-tokenomics reveal-section" ref={tokenomicsRef}>
            <h2>$MONECO Tokenomics</h2>
            <p>Protokolün ekonomik yapısı</p>
            <div className="token-stats">
              <div className="token-stat">
                <span>Toplam Arz</span>
                <strong>100,000,000</strong>
              </div>
              <div className="token-stat">
                <span>Ağ</span>
                <strong>Monad</strong>
              </div>
              <div className="token-stat">
                <span>Stake (Toplayıcı)</span>
                <strong>1,000</strong>
              </div>
              <div className="token-stat">
                <span>Slash Mekanizması</span>
                <strong>Token Yakma</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
