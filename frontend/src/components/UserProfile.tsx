import React, { useEffect, useState } from 'react';
import { UserRole, LevelInfo } from '../types';
import { fetchUserInfo, computeLevelInfo, shortAddress, useRegister, isDemoMode } from '../hooks/useContract';
import { COLLECTOR_STAKE_AMOUNT } from '../constants';

interface Props {
  address:     string;
  userRole:    UserRole | null;
  setUserRole: (r: UserRole | null) => void;
}

const LEVEL_COLORS = [
  '#9aa0a6','#1e8e3e','#34a853','#7cb342','#f9ab00',
  '#e37400','#e8710a','#d93025','#c2185b','#1a73e8',
];

export const UserProfile: React.FC<Props> = ({ address, userRole, setUserRole }) => {
  const [levelInfo,   setLevelInfo]   = useState<LevelInfo | null>(null);
  const [totalEarned, setTotalEarned] = useState('0');
  const [isSlashed,   setIsSlashed]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  const { registerCollector, registerValidator, switchRole, loading: regLoading, error: regError } = useRegister();

  useEffect(() => { loadUserInfo(); }, [address]);

  const loadUserInfo = async () => {
    setLoading(true);
    const info = await fetchUserInfo(address);
    if (info && info.role !== 0) {
      const role: UserRole = info.role === 1 ? 'collector' : 'validator';
      setUserRole(role);
      setLevelInfo(computeLevelInfo(info.correctAnswers, info.level));
      setTotalEarned((Number(info.totalEarned) / 1e18).toFixed(2));
      setIsSlashed(info.isSlashed);
    } else {
      setUserRole(null);
      setShowRegister(true);
    }
    setLoading(false);
  };

  const handleRegister = async (role: UserRole) => {
    if (role === 'collector') await registerCollector();
    else                      await registerValidator();
    await loadUserInfo();
  };

  const handleSwitchRole = async () => {
    if (!userRole) return;
    const newRole = userRole === 'collector' ? 'validator' : 'collector';
    await switchRole(newRole);
    await loadUserInfo();
  };

  if (loading) return <div className="profile-card loading">Yükleniyor...</div>;

  if (!userRole && showRegister) {
    return (
      <div className="profile-card register-card">
        <h3>Protokole Katıl</h3>
        <p className="register-subtitle">
          {isDemoMode() ? 'Demo mod — sözleşme deploy bekleniyor' : 'Bir rol seçin ve başlayın'}
        </p>
        <div className="register-options">
          <button
            className="btn btn-collector"
            onClick={() => handleRegister('collector')}
            disabled={regLoading}
          >
            Toplayıcı Ol
            <small>{COLLECTOR_STAKE_AMOUNT} $MONECO stake</small>
          </button>
          <button
            className="btn btn-validator"
            onClick={() => handleRegister('validator')}
            disabled={regLoading}
          >
            Doğrulayıcı Ol
            <small>Stake gerekmez</small>
          </button>
        </div>
        {regError && <p className="error-text">{regError}</p>}
      </div>
    );
  }

  if (!levelInfo) return null;

  const levelColor = LEVEL_COLORS[levelInfo.currentLevel - 1] ?? '#9aa0a6';
  const initials   = userRole === 'collector' ? 'CO' : 'VA';

  return (
    <div className={`profile-card ${isSlashed ? 'slashed' : ''}`}>
      <div className="profile-header">
        <div className="avatar" style={{ background: levelColor }}>
          {initials}
        </div>
        <div className="profile-info">
          <span className="profile-address">{shortAddress(address)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span className="profile-role" style={{ margin: 0 }}>
              {userRole === 'collector' ? 'Toplayıcı' : 'Doğrulayıcı'}
            </span>
            <button 
              onClick={handleSwitchRole} 
              disabled={regLoading}
              style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text)' }}
            >
              {regLoading ? '...' : (userRole === 'collector' ? 'Değiştir (VA)' : 'Değiştir (CO)')}
            </button>
          </div>
        </div>
      </div>

      {isSlashed && (
        <div className="slash-badge">Hesap askıya alındı</div>
      )}

      <div className="level-section">
        <div className="level-badge" style={{ borderColor: levelColor }}>
          <span className="level-label">Seviye</span>
          <span className="level-number" style={{ color: levelColor }}>
            {levelInfo.currentLevel}
          </span>
        </div>
        <div className="level-progress-wrap">
          <div className="level-progress-bar">
            <div
              className="level-progress-fill"
              style={{ width: `${levelInfo.progress}%`, background: levelColor }}
            />
          </div>

        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-num">{levelInfo.correctAnswers} Doğru</span>
        </div>
        <div className="stat-item">
          <span className="stat-num" style={{ color: '#f9ab00' }}>{totalEarned} MONECO</span>
        </div>
        <div className="stat-item">
          <span className="stat-num" style={{ color: '#1e8e3e' }}>
            {(levelInfo.rewardMultiplier * 100).toFixed(0)}% Çarpan
          </span>
        </div>
      </div>
    </div>
  );
};
