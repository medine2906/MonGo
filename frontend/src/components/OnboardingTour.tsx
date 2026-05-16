import React, { useState } from 'react';

interface Step {
  icon: string;
  color: string;
  title: string;
  desc: string;
  hint?: string;
}

const STEPS: Step[] = [
  {
    icon: '🌍',
    color: '#1a73e8',
    title: 'MONECO\'ya Hoş Geldiniz',
    desc: 'Çevrenizi fotoğraflayın, AI kirlilik seviyesini belirlesin ve MON token kazanın. Merkeziyetsiz bir çevre izleme protokolü.',
    hint: 'Sadece 4 adımda nasıl çalıştığını öğren →',
  },
  {
    icon: '🗺️',
    color: '#34a853',
    title: 'Renkli Harita',
    desc: 'Haritadaki her nokta bir çevre izleme alanını temsil eder. Renk o bölgenin kirlilik durumunu gösterir.',
    hint: '🟢 Temiz   🟠 Orta Kirli   🔴 Kirli',
  },
  {
    icon: '📸',
    color: '#ff8c00',
    title: 'Fotoğrafını Çek',
    desc: 'Haritadan bir nokta seçin, bulunduğunuz çevrenin fotoğrafını gönderin. Konum doğrulaması ile sahte gönderi engellenir.',
    hint: 'Gerçek çevre fotoğrafı gönder, fark yarat!',
  },
  {
    icon: '🤖',
    color: '#9c27b0',
    title: 'AI Doğrular',
    desc: 'Yapay zeka fotoğrafın gerçek bir çevre görüntüsü olup olmadığını ve kirlilik seviyesini otomatik olarak analiz eder.',
    hint: 'Sahte veya yapay fotoğraflar otomatik reddedilir.',
  },
  {
    icon: '🪙',
    color: '#f9ab00',
    title: 'MON Token Kazan',
    desc: 'Doğrulanan her fotoğraf için MON token kazanırsın. Seviye atladıkça ödül çarpanın artar — ne çok katkıda bulunursan o kadar fazla kazan!',
    hint: 'Cüzdanını bağla ve hemen başla!',
  },
];

interface Props {
  onClose: () => void;
}

export const OnboardingTour: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);

  const go = (dir: 'forward' | 'back') => {
    if (animating) return;
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(s => dir === 'forward' ? s + 1 : s - 1);
      setAnimating(false);
    }, 220);
  };

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <div className="onb-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="onb-card">

        {/* Skip */}
        <button className="onb-skip" onClick={onClose}>Geç</button>

        {/* Icon */}
        <div
          className={`onb-icon-wrap ${animating ? (animDir === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in'}`}
          style={{ background: current.color + '18', borderColor: current.color + '40' }}
        >
          <span className="onb-icon">{current.icon}</span>
        </div>

        {/* Content */}
        <div
          className={`onb-content ${animating ? (animDir === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in'}`}
        >
          <h2 className="onb-title">{current.title}</h2>
          <p className="onb-desc">{current.desc}</p>
          {current.hint && (
            <div className="onb-hint" style={{ borderColor: current.color + '50', color: current.color }}>
              {current.hint}
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="onb-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onb-dot ${i === step ? 'active' : ''}`}
              style={i === step ? { background: current.color } : {}}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="onb-actions">
          {step > 0 && (
            <button className="onb-btn-back" onClick={() => go('back')}>
              ← Geri
            </button>
          )}
          <button
            className="onb-btn-next"
            style={{ background: current.color }}
            onClick={() => isLast ? onClose() : go('forward')}
          >
            {isLast ? 'Başla!' : 'İleri →'}
          </button>
        </div>

        {/* Step counter */}
        <div className="onb-counter">{step + 1} / {STEPS.length}</div>
      </div>
    </div>
  );
};
