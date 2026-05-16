import React, { useState, useEffect, useRef } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { UserProfile }   from './components/UserProfile';
import { MapView }       from './components/MapView';
import { CollectorPanel } from './components/CollectorPanel';
import { ValidatorPanel } from './components/ValidatorPanel';
import { HowItWorks }    from './components/HowItWorks';
import { OnboardingTour } from './components/OnboardingTour';
import { WalletState, UserRole, ContainerLocation } from './types';
import { generateSimulatedLocations } from './utils/locationSimulator';
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
  const [showGuide,   setShowGuide]   = useState(false);
  const [locations,   setLocations]   = useState<ContainerLocation[]>(() => generateSimulatedLocations(150));

  useEffect(() => {
    const seen = localStorage.getItem('moneco_onboarding_done');
    if (!seen) setShowGuide(true);
  }, []);

  const closeGuide = () => {
    localStorage.setItem('moneco_onboarding_done', 'true');
    setShowGuide(false);
  };

  const tokenomicsRef = useReveal();

  const handleLocationSelect = (loc: ContainerLocation) => {
    setSelectedLoc(loc);
    if (userRole === 'collector') setActiveTab('collector');
    else if (userRole === 'validator') setActiveTab('validator');
  };

  return (
    <div className="app-root">
      {showGuide && <OnboardingTour onClose={closeGuide} />}
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
          <a href="/docs.html" target="_blank" rel="noreferrer">Docs</a>
        </nav>
        <WalletConnect walletState={walletState} setWalletState={setWalletState} />
      </header>

      {walletState.isConnected && walletState.address ? (
        /* ── Bağlı: harita tam ekran, paneller float ─────── */
        <div className="app-body">
          <div className="map-full">
            <MapView locations={locations} onLocationSelect={handleLocationSelect} selectedLocation={selectedLoc} />
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
                  Harita
                </button>
                {userRole === 'collector' && (
                  <button
                    className={`tab-btn ${activeTab === 'collector' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collector')}
                  >
                    Fotoğraf Gönder
                  </button>
                )}
                {userRole === 'validator' && (
                  <button
                    className={`tab-btn ${activeTab === 'validator' ? 'active' : ''}`}
                    onClick={() => setActiveTab('validator')}
                  >
                    Doğrula
                  </button>
                )}
              </nav>
            )}


          </aside>

          {activeTab === 'collector' && userRole === 'collector' && (
            <div className="floating-panel">
              <CollectorPanel 
                selectedLocation={selectedLoc} 
                walletAddress={walletState.address}
                onPhotoUploaded={(photoUrl, pollutionLevel) => {
                  if (selectedLoc) {
                    // pollutionLevel: 0-30=temiz(yeşil), 31-70=orta(turuncu), 71-100=kirli(kırmızı)
                    const newColor = pollutionLevel > 70 ? 'red' : pollutionLevel > 30 ? 'orange' : 'green';
                    setLocations(locs => locs.map(l =>
                      l.id === selectedLoc.id
                        ? { ...l, photos: [...(l.photos || []), photoUrl], markerColor: newColor }
                        : l
                    ));
                  }
                }}
              />
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
              Bulunduğunuz noktadan çevrenizin fotoğrafını çekin.
              <br />
              AI gerçekliği doğrular, kirlilik seviyesini belirler. Merkeziyetsiz <strong>Proof of Image</strong> protokolüyle ödüllendirilip seviye atlayın.
            </p>
            <WalletConnect walletState={walletState} setWalletState={setWalletState} />
          </div>

          {/* Hero → HowItWorks geçiş */}
          <div className="section-wave">
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="var(--white)" />
            </svg>
          </div>

          {/* Interactive How It Works */}
          <HowItWorks />

          {/* HowItWorks → Tokenomics geçiş */}
          <div style={{ lineHeight: 0, background: 'var(--white)' }}>
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 60, display: 'block' }}>
              <path d="M0,40 C360,0 1080,80 1440,40 L1440,80 L0,80 Z" fill="var(--bg-1)" />
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
