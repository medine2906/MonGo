import React, { useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import '../styles/hiw-tw.css';

interface TabDef {
  num: string;
  label: string;
  subLabel: string;
  body: string;
  metricLabel: string;
  metricValue: string;
  accent: string;
}

const TABS: TabDef[] = [
  {
    num: '01',
    label: 'Toplayıcı',
    subLabel: 'Collector',
    body: '1000 $MONECO stake yapın, izbe bölgelerdeki çöp noktalarını fotoğraflayın ve havuz ödülü kazanın.',
    metricLabel: 'Maks. Ödül',
    metricValue: '400 $MONECO / fotoğraf',
    accent: '#22d3ee',
  },
  {
    num: '02',
    label: 'Doğrulayıcı',
    subLabel: 'Validator',
    body: 'Fotoğrafları oylayın. Doğru oylar havuzdan pay ve seviye puanı getirir. Yanlış oy limiti aşılınca sistemden uzaklaştırılırsınız (ban).',
    metricLabel: 'Havuz Payı',
    metricValue: '%30 doğrulayıcılara',
    accent: '#a78bfa',
  },
  {
    num: '03',
    label: 'Seviye Sistemi',
    subLabel: 'Level System',
    body: "Seviye 1'den 10'a kadar geometrik eşiklerle yükselin. Her seviye %5 ekstra ödül çarpanı getirir.",
    metricLabel: 'Seviye 10 Çarpanı',
    metricValue: '×1.45 ödül',
    accent: '#34d399',
  },
];

/* ─────────────────────────────────────────────
   Animation Variants
───────────────────────────────────────────── */
const panelVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.075, delayChildren: 0.03 },
  },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const },
  },
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export const HowItWorks: React.FC = () => {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <MotionConfig reducedMotion="user">
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--white)', padding: '80px 24px 72px' }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Per-tab ambient glow — each one crossfades */}
        {TABS.map((t, i) => (
          <motion.div
            key={t.accent}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 72% 52% at 50% 0%, ${t.accent}16 0%, transparent 65%)`,
            }}
            animate={{ opacity: active === i ? 1 : 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />
        ))}

        <div className="relative" style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* ── Section header ── */}
          <motion.div
            className="text-center"
            style={{ marginBottom: 52 }}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.62, ease: [0.4, 0, 0.2, 1] }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 10,
                letterSpacing: '0.38em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                marginBottom: 14,
                fontFamily: "'Roboto Mono', monospace",
              }}
            >
              Protocol
            </span>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 300,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                marginBottom: 10,
                lineHeight: 1.2,
              }}
            >
              Nasıl Çalışır?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              Protokolün üç temel katmanını keşfedin.
            </p>
          </motion.div>

          {/* ── Tab headers ── */}
          <div
            className="flex items-start"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {TABS.map((t, i) => {
              const isActive = i === active;
              return (
                <React.Fragment key={t.num}>
                  {i > 0 && (
                    <div
                      className="flex-shrink-0 self-center"
                      style={{
                        width: 32,
                        height: 1,
                        marginBottom: 40,
                        background: 'linear-gradient(90deg, var(--border), var(--bg-2), var(--border))',
                      }}
                    />
                  )}

                  <motion.button
                    className="relative flex flex-col items-start text-left flex-1"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      gap: 9,
                      padding: '0 4px 18px 0',
                    }}
                    onClick={() => setActive(i)}
                    whileHover={!isActive ? { opacity: 0.58 } : undefined}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Step number */}
                    <motion.span
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.13em',
                        fontFamily: "'Roboto Mono', monospace",
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      animate={{
                        color: isActive ? t.accent : 'var(--text-3)',
                        opacity: isActive ? 0.52 : 1,
                      }}
                      transition={{ duration: 0.22 }}
                    >
                      {t.num}
                    </motion.span>

                    {/* Labels */}
                    <div className="flex flex-col" style={{ gap: 2 }}>
                      <motion.span
                        style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em' }}
                        animate={{ color: isActive ? 'var(--text)' : 'var(--text-2)' }}
                        transition={{ duration: 0.22 }}
                      >
                        {t.label}
                      </motion.span>
                      <motion.span
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                        animate={{ color: isActive ? 'var(--text-2)' : 'var(--text-3)' }}
                        transition={{ duration: 0.22 }}
                      >
                        {t.subLabel}
                      </motion.span>
                    </div>

                    {/* Sliding active indicator — shared layout animation */}
                    {isActive && (
                      <motion.div
                        layoutId="hiw-indicator"
                        className="absolute"
                        style={{
                          bottom: 0,
                          left: 0,
                          right: 4,
                          height: 1.5,
                          background: t.accent,
                        }}
                        transition={{ type: 'spring', bounce: 0.16, duration: 0.52 }}
                      />
                    )}
                  </motion.button>
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Content panel ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative overflow-hidden"
              style={{
                border: '1px solid var(--border)',
                borderTop: 'none',
                borderRadius: '0 0 14px 14px',
                padding: '36px 40px 32px',
                background: 'var(--bg-1)',
              }}
            >
              {/* Accent hairline at top */}
              <motion.div
                variants={itemVariants}
                className="absolute"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, ${tab.accent}88, ${tab.accent}2a, transparent)`,
                }}
              />

              {/* Radial accent wash */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 55% 75% at 0% 0%, ${tab.accent}0e 0%, transparent 58%)`,
                }}
              />

              {/* Body text */}
              <motion.p
                variants={itemVariants}
                style={{
                  fontSize: 16,
                  fontWeight: 300,
                  lineHeight: 1.78,
                  color: 'var(--text-2)',
                  maxWidth: 540,
                  marginBottom: 28,
                  position: 'relative',
                }}
              >
                {tab.body}
              </motion.p>

              {/* Metric badge */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center"
                style={{
                  gap: 10,
                  padding: '7px 18px',
                  borderRadius: 100,
                  border: `1px solid ${tab.accent}3a`,
                  background: `${tab.accent}0d`,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-3)',
                    fontFamily: "'Roboto Mono', monospace",
                  }}
                >
                  {tab.metricLabel}
                </span>
                <span
                  style={{
                    width: 1,
                    height: 10,
                    flexShrink: 0,
                    background: `${tab.accent}35`,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: tab.accent,
                  }}
                >
                  {tab.metricValue}
                </span>
              </motion.div>


            </motion.div>
          </AnimatePresence>

          {/* ── Step indicator dots ── */}
          <div
            className="flex justify-center items-center"
            style={{ gap: 8, marginTop: 28 }}
          >
            {TABS.map((t, i) => (
              <motion.button
                key={i}
                onClick={() => setActive(i)}
                style={{ border: 'none', padding: 0, cursor: 'pointer', height: 5 }}
                animate={{
                  width: active === i ? 20 : 5,
                  backgroundColor: active === i ? t.accent : 'var(--border)',
                  borderRadius: active === i ? 3 : 999,
                  boxShadow: active === i ? `0 0 8px ${t.accent}32` : 'none',
                }}
                transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                aria-label={t.label}
              />
            ))}
          </div>

        </div>
      </section>
    </MotionConfig>
  );
};
