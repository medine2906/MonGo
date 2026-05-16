import React, { useState } from 'react';
import { ImagePoolData } from '../types';
import { castVote } from '../hooks/useContract';
import { DEMO_PENDING_POOLS } from '../utils/locationSimulator';
import { MARKER_COLORS } from '../constants';

interface Props {
  walletAddress?: string;
}

type VoteState = 'idle' | 'voting' | 'voted';

interface PoolVoteState {
  state:     VoteState;
  userVote?: boolean;
  error?:    string;
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: MARKER_COLORS.red,
  2: '#FF8C00',
  3: '#CDDC39',
  4: '#8BC34A',
  5: MARKER_COLORS.green,
};

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h} saat önce` : `${m} dakika önce`;
};

export const ValidatorPanel: React.FC<Props> = (_props) => {
  const [pools,      setPools]      = useState<ImagePoolData[]>(DEMO_PENDING_POOLS);
  const [voteStates, setVoteStates] = useState<Record<string, PoolVoteState>>({});
  const [activePool, setActivePool] = useState<string | null>(null);
  const [filter,     setFilter]     = useState<'all'|'high'|'medium'|'low'>('all');

  const filteredPools = pools.filter(p => {
    if (filter === 'all')    return true;
    if (filter === 'high')   return p.difficulty >= 4;
    if (filter === 'medium') return p.difficulty === 3;
    return p.difficulty <= 2;
  });

  const handleVote = async (poolId: string, approve: boolean) => {
    setVoteStates(prev => ({ ...prev, [poolId]: { state: 'voting' } }));

    try {
      await castVote(poolId, approve);
      setVoteStates(prev => ({
        ...prev,
        [poolId]: { state: 'voted', userVote: approve },
      }));
      // Havuz oylarını güncelle (simülasyon)
      setPools(prev => prev.map(p => {
        if (p.poolId !== poolId) return p;
        return {
          ...p,
          approveVotes: approve ? p.approveVotes + 1 : p.approveVotes,
          rejectVotes:  approve ? p.rejectVotes  : p.rejectVotes + 1,
        };
      }));
    } catch (e: unknown) {
      setVoteStates(prev => ({
        ...prev,
        [poolId]: { state: 'idle', error: (e as Error).message },
      }));
    }
  };

  const totalVotes       = (p: ImagePoolData) => p.approveVotes + p.rejectVotes;
  const approvalPercent  = (p: ImagePoolData) => {
    const total = totalVotes(p);
    return total > 0 ? Math.round((p.approveVotes / total) * 100) : 0;
  };

  return (
    <div className="panel validator-panel">
      <div className="panel-header">
        <h2>✅ Doğrulayıcı Paneli</h2>
        <p>Havuzdaki fotoğrafları inceleyin ve oyunuzu kullanın</p>
      </div>

      {/* Filtreler */}
      <div className="validator-filters">
        {(['all','high','medium','low'] as const).map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all'    && 'Tümü'}
            {f === 'high'   && '⭐⭐⭐⭐⭐ Yüksek Ödül'}
            {f === 'medium' && '⭐⭐⭐ Orta'}
            {f === 'low'    && '⭐ Düşük'}
          </button>
        ))}
        <span className="pool-count">{filteredPools.length} havuz bekliyor</span>
      </div>

      {/* Havuz Listesi */}
      <div className="pool-list">
        {filteredPools.length === 0 && (
          <div className="empty-state">
            <span>🎉</span>
            <p>Tüm havuzlar değerlendirildi!</p>
          </div>
        )}

        {filteredPools.map(pool => {
          const vs      = voteStates[pool.poolId] ?? { state: 'idle' };
          const apPct   = approvalPercent(pool);
          const isActive = activePool === pool.poolId;

          return (
            <div
              key={pool.poolId}
              className={`pool-card ${isActive ? 'expanded' : ''} ${vs.state === 'voted' ? 'voted' : ''}`}
            >
              {/* Kart başlığı */}
              <div
                className="pool-card-header"
                onClick={() => setActivePool(isActive ? null : pool.poolId)}
              >
                <div className="pool-title">
                  <span
                    className="difficulty-badge"
                    style={{ background: DIFFICULTY_COLORS[pool.difficulty] }}
                  >
                    {'⭐'.repeat(pool.difficulty)}
                  </span>
                  <div>
                    <strong>{pool.locationName}</strong>
                    <small>{timeAgo(pool.submittedAt)}</small>
                  </div>
                </div>
                <div className="pool-reward-badge">
                  <span className="reward-value">{pool.reward}</span>
                  <span className="reward-ticker">$MONECO</span>
                </div>
                <span className="expand-icon">{isActive ? '▲' : '▼'}</span>
              </div>

              {/* Detay (expand) */}
              {isActive && (
                <div className="pool-card-body">
                  {/* Fotoğraf */}
                  {pool.ipfsUrl && (
                    <div className="pool-image-wrap">
                      <img
                        src={pool.ipfsUrl}
                        alt="Fotoğraf kanıtı"
                        className="pool-image"
                        loading="lazy"
                      />
                      <div className="image-overlay">
                        <span>🔍 Fotoğrafı inceleyin</span>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="pool-metadata">
                    <div className="meta-row">
                      <span>🏠 Toplayıcı</span>
                      <code>{pool.collector.slice(0, 10)}...</code>
                    </div>
                    <div className="meta-row">
                      <span>🔑 Pool ID</span>
                      <code>{pool.poolId}</code>
                    </div>
                    <div className="meta-row">
                      <span>📊 Durum</span>
                      <span className="status-chip">{pool.status}</span>
                    </div>
                  </div>

                  {/* Oy durumu */}
                  <div className="vote-progress-section">
                    <div className="vote-bar">
                      <div
                        className="vote-fill approve"
                        style={{ width: `${apPct}%` }}
                      />
                      <div
                        className="vote-fill reject"
                        style={{ width: `${100 - apPct}%` }}
                      />
                    </div>
                    <div className="vote-labels">
                      <span style={{ color: '#4CAF50' }}>✅ {pool.approveVotes} Onayla ({apPct}%)</span>
                      <span style={{ color: '#FF4444' }}>❌ {pool.rejectVotes} Reddet</span>
                    </div>
                  </div>

                  {/* Oy butonları */}
                  {vs.state === 'idle' && (
                    <div className="vote-buttons">
                      <button
                        className="btn btn-approve"
                        onClick={() => handleVote(pool.poolId, true)}
                      >
                        ✅ Gerçek Fotoğraf
                      </button>
                      <button
                        className="btn btn-reject"
                        onClick={() => handleVote(pool.poolId, false)}
                      >
                        ❌ Sahte / AI Üretimi
                      </button>
                    </div>
                  )}

                  {vs.state === 'voting' && (
                    <div className="voting-status">
                      <div className="spinner" />
                      <span>Oy kaydediliyor...</span>
                    </div>
                  )}

                  {vs.state === 'voted' && (
                    <div className={`voted-status ${vs.userVote ? 'approved' : 'rejected'}`}>
                      <span>{vs.userVote ? '✅ Onayladınız' : '❌ Reddettiniz'}</span>
                      <small>Oy kaydedildi, ödül havuz sonuçlanınca dağıtılacak</small>
                    </div>
                  )}

                  {vs.error && <p className="error-text">{vs.error}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Doğrulayıcı kuralları */}
      <div className="rules-box">
        <h4>📜 Doğrulayıcı Kuralları</h4>
        <ul>
          <li>Fotoğrafı dikkatlice inceleyin; konum, içerik ve özgünlüğü değerlendirin</li>
          <li>Çoğunlukla (≥60%) yanlış oy → uyarı puanı alırsınız</li>
          <li>20 yanlış oy → protokolden kalıcı ban</li>
          <li>Doğru oy → havuz ödülünün %30'undan pay + seviye puanı</li>
        </ul>
      </div>
    </div>
  );
};
