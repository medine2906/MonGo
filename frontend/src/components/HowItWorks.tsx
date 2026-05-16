import React, { useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import '../styles/hiw-tw.css';

/* ─────────────────────────────────────────────
   Animated SVG Icons
   Each icon draws / reveals itself when active
───────────────────────────────────────────── */
type IconProps = { active: boolean };

const ApertureIcon: React.FC<IconProps> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    {/* Outer ring draws in */}
    <motion.circle
      cx="12" cy="12" r="9"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
      initial={false}
      animate={{ pathLength: active ? 1 : 0.35, opacity: active ? 1 : 0.28 }}
      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
    />
    {/* Inner iris */}
    <motion.circle
      cx="12" cy="12" r="3.5"
      stroke="currentColor" strokeWidth="1"
      initial={false}
      animate={{ scale: active ? 1 : 0.4, opacity: active ? 0.85 : 0.15 }}
      transition={{ duration: 0.45, delay: active ? 0.18 : 0 }}
    />
    {/* 6 aperture blades */}
    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
      const rad = (deg - 90) * (Math.PI / 180);
      return (
        <motion.line
          key={deg}
          x1={12 + Math.cos(rad) * 9}   y1={12 + Math.sin(rad) * 9}
          x2={12 + Math.cos(rad) * 5.5} y2={12 + Math.sin(rad) * 5.5}
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
          initial={false}
          animate={{ opacity: active ? 0.6 : 0 }}
          transition={{ delay: active ? i * 0.055 : 0, duration: 0.28 }}
        />
      );
    })}
  </svg>
);

const ShieldIcon: React.FC<IconProps> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    {/* Shield outline draws in */}
    <motion.path
      d="M12 2.5L20 5.8V12C20 16.2 16.5 20 12 21.5C7.5 20 4 16.2 4 12V5.8L12 2.5Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"
      initial={false}
      animate={{ pathLength: active ? 1 : 0.45, opacity: active ? 1 : 0.28 }}
      transition={{ duration: 0.62, ease: [0.4, 0, 0.2, 1] }}
    />
    {/* Checkmark draws in after outline */}
    <motion.path
      d="M8.5 12L11 14.5L15.5 9.5"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      initial={false}
      animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
      transition={{ duration: 0.36, delay: active ? 0.38 : 0 }}
    />
  </svg>
);

const LevelIcon: React.FC<IconProps> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    {/* Four ascending bars with spring bounce */}
    {[
      { x: 2,  h: 5,  delay: 0    },
      { x: 7,  h: 9,  delay: 0.07 },
      { x: 12, h: 13, delay: 0.14 },
      { x: 17, h: 17, delay: 0.21 },
    ].map(({ x, h, delay }, i) => (
      <motion.rect
        key={x}
        x={x} width="4" rx="0.8"
        fill="currentColor"
        initial={false}
        animate={{
          y: active ? 22 - h : 22,
          height: active ? h : 0,
          opacity: active ? 0.35 + i * 0.18 : 0,
        }}
        transition={{ delay: active ? delay : 0, duration: 0.44, ease: [0.34, 1.56, 0.64, 1] }}
      />
    ))}
    {/* Rising dot above tallest bar */}
    <motion.circle
      cx="20" cy="3" r="2"
      fill="currentColor"
      initial={false}
      animate={{ scale: active ? 1 : 0, opacity: active ? 0.85 : 0 }}
      transition={{ delay: active ? 0.3 : 0, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    />
  </svg>
);

/* ─────────────────────────────────────────────
   Tab Data
───────────────────────────────────────────── */
interface TabDef {
  num: string;
  label: string;
  subLabel: string;
  Icon: React.FC<IconProps>;
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
    Icon: ApertureIcon,
    body: '1000 $MONECO stake yapın, izbe bölgelerdeki çöp noktalarını fotoğraflayın ve havuz ödülü kazanın.',
    metricLabel: 'Maks. Ödül',
    metricValue: '400 $MONECO / fotoğraf',
    accent: '#22d3ee',
  },
  {
    num: '02',
    label: 'Doğrulayıcı',
    subLabel: 'Validator',
    Icon: ShieldIcon,
    body: 'Fotoğrafları oylayın. Doğru oylar havuzdan pay ve seviye puanı getirir. Yanlış oy limiti aşılınca sistemden uzaklaştırılırsınız (ban).',
    metricLabel: 'Havuz Payı',
    metricValue: '%30 doğrulayıcılara',
    accent: '#a78bfa',
  },
  {
    num: '03',
    label: 'Seviye Sistemi',
    subLabel: 'Level System',
    Icon: LevelIcon,
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
        style={{ background: '#07070f', padding: '80px 24px 72px' }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px)',
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
                color: '#2a2f4a',
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
                color: '#dde0f0',
                marginBottom: 10,
                lineHeight: 1.2,
              }}
            >
              Nasıl Çalışır?
            </h2>
            <p style={{ fontSize: 13, color: '#2e3453' }}>
              Protokolün üç temel katmanını keşfedin.
            </p>
          </motion.div>

          {/* ── Tab headers ── */}
          <div
            className="flex items-start"
            style={{ borderBottom: '1px solid #111220' }}
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
                        background: 'linear-gradient(90deg, #111220, #1c1f38, #111220)',
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
                        color: isActive ? t.accent : '#202338',
                        opacity: isActive ? 0.52 : 1,
                      }}
                      transition={{ duration: 0.22 }}
                    >
                      {t.num}
                    </motion.span>

                    {/* Icon box */}
                    <motion.div
                      className="flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid',
                        flexShrink: 0,
                      }}
                      animate={{
                        borderColor: isActive ? `${t.accent}50` : '#141628',
                        backgroundColor: isActive ? `${t.accent}12` : '#0c0e1c',
                        color: isActive ? t.accent : '#252a45',
                        boxShadow: isActive ? `0 0 16px ${t.accent}22` : 'none',
                      }}
                      transition={{ duration: 0.32 }}
                    >
                      <t.Icon active={isActive} />
                    </motion.div>

                    {/* Labels */}
                    <div className="flex flex-col" style={{ gap: 2 }}>
                      <motion.span
                        style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em' }}
                        animate={{ color: isActive ? '#cdd0e8' : '#2e3455' }}
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
                        animate={{ color: isActive ? '#30365a' : '#1e2135' }}
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
                border: '1px solid #111220',
                borderTop: 'none',
                borderRadius: '0 0 14px 14px',
                padding: '36px 40px 32px',
                background: '#08090f',
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
                  color: '#7b8098',
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
                    color: '#363b5c',
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

              {/* Decorative corner orbit — slow continuous rotation */}
              <motion.div
                variants={itemVariants}
                className="absolute pointer-events-none"
                style={{ right: -48, top: -48 }}
              >
                <motion.svg
                  width="160"
                  height="160"
                  viewBox="0 0 160 160"
                  fill="none"
                  style={{ color: tab.accent }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                >
                  <circle
                    cx="80" cy="80" r="70"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.1"
                    strokeDasharray="5 9"
                  />
                  <circle
                    cx="80" cy="80" r="44"
                    stroke="currentColor"
                    strokeWidth="0.4"
                    opacity="0.07"
                  />
                  <circle cx="80" cy="80" r="16" fill="currentColor" opacity="0.04" />
                  {/* Orbit ticks that make rotation visible */}
                  <circle cx="80" cy="10" r="3" fill="currentColor" opacity="0.22" />
                  <circle cx="150" cy="80" r="2" fill="currentColor" opacity="0.14" />
                </motion.svg>
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
                  backgroundColor: active === i ? t.accent : '#1a1d2e',
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
