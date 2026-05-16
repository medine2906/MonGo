import React, { useState, useRef } from 'react';
import { ContainerLocation } from '../types';
import { submitImage } from '../hooks/useContract';
import { MARKER_COLORS } from '../constants';

interface Props {
  selectedLocation: ContainerLocation | null;
  walletAddress?:   string;
}

type UploadStep = 'select' | 'preview' | 'uploading' | 'aicheck' | 'success' | 'error';

/* Minimal SVG icons */
const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CpuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);

export const CollectorPanel: React.FC<Props> = ({ selectedLocation }) => {
  const [step,       setStep]       = useState<UploadStep>('select');
  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [poolId,     setPoolId]     = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMsg('Lütfen bir görsel dosyası seçin.'); return; }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('preview');
    setErrorMsg(null);
  };

  const handleUpload = async () => {
    if (!selectedLocation || !imageFile) return;
    setStep('uploading');
    setErrorMsg(null);
    try {
      const id = await submitImage(
        selectedLocation.latitude, selectedLocation.longitude,
        selectedLocation.locationName, selectedLocation.difficulty, imageFile
      );
      setPoolId(id);
      simulateAICheck();
    } catch (e: unknown) {
      setStep('error');
      setErrorMsg((e as Error).message);
    }
  };

  const simulateAICheck = () => {
    setStep('aicheck');
    setAiProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      setAiProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep(Math.random() > 0.2 ? 'success' : 'error'), 500);
      }
    }, 200);
  };

  const handleReset = () => {
    setStep('select'); setImageFile(null); setPreviewUrl(null);
    setPoolId(null); setErrorMsg(null); setAiProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getColorStyle = (color: ContainerLocation['markerColor']) => ({
    color: MARKER_COLORS[color], borderColor: MARKER_COLORS[color],
  });

  return (
    <div className="panel collector-panel">
      <div className="panel-header">
        <h2>Toplayıcı Paneli</h2>
        <p>Haritadan bir konteyner konumu seçip fotoğraf yükleyin</p>
      </div>

      {selectedLocation ? (
        <div className="selected-location-card" style={getColorStyle(selectedLocation.markerColor)}>
          <div className="location-card-header">
            <span className="location-pin" />
            <div>
              <strong>{selectedLocation.locationName}</strong>
              <span className="location-city">{selectedLocation.city}</span>
            </div>
            <div className="location-reward">
              <span className="reward-amount">{selectedLocation.reward}</span>
              <span className="reward-unit">$MONECO</span>
            </div>
          </div>
          <div className="location-meta">
            <span>Yükleme: {selectedLocation.uploadCount} kişi</span>
            <span>Zorluk: {selectedLocation.difficulty}/5</span>
            <span>Kişi başı: {selectedLocation.uploadCount > 0
              ? (selectedLocation.reward / selectedLocation.uploadCount).toFixed(2)
              : selectedLocation.reward} $MONECO
            </span>
          </div>
        </div>
      ) : (
        <div className="no-location-hint">
          Haritadan bir konteyner noktasına tıklayın
        </div>
      )}

      {selectedLocation && (
        <div className="upload-section">
          {step === 'select' && (
            <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
              <div className="drop-icon"><CameraIcon /></div>
              <p>Fotoğraf seçmek için tıklayın</p>
              <small>JPG, PNG, WEBP — Maks. 10 MB</small>
              <input
                ref={fileInputRef} type="file"
                accept="image/*" capture="environment"
                onChange={handleFileChange} style={{ display: 'none' }}
              />
            </div>
          )}

          {step === 'preview' && previewUrl && (
            <div className="preview-section">
              <img src={previewUrl} alt="Önizleme" className="preview-image" />
              <div className="preview-meta">
                <span>{imageFile?.name}</span>
                <span>{((imageFile?.size ?? 0) / 1024).toFixed(0)} KB</span>
              </div>
              <div className="preview-actions">
                <button className="btn btn-secondary" onClick={handleReset}>Yeniden Seç</button>
                <button className="btn btn-primary"   onClick={handleUpload}>Havuza Yükle</button>
              </div>
            </div>
          )}

          {step === 'uploading' && (
            <div className="status-card uploading">
              <div className="spinner large" />
              <h3>Zincire yükleniyor</h3>
              <small>Lütfen MetaMask işlemini onaylayın</small>
            </div>
          )}

          {step === 'aicheck' && (
            <div className="status-card aicheck">
              <div className="ai-icon-wrap"><CpuIcon /></div>
              <h3>AI Ön Kontrol</h3>
              <div className="ai-progress-bar">
                <div className="ai-progress-fill" style={{ width: `${aiProgress}%` }} />
              </div>
              <small>{aiProgress < 40 ? 'Görsel analiz ediliyor...' : aiProgress < 70 ? 'Meta veri doğrulanıyor...' : 'Sonuç bekleniyor...'}</small>
            </div>
          )}

          {step === 'success' && (
            <div className="status-card success">
              <div className="status-indicator success"><CheckIcon /></div>
              <h3>Fotoğraf Onaylandı</h3>
              <p>Havuz açıldı, doğrulayıcılar oylayacak.</p>
              {poolId && (
                <div className="pool-id-box">
                  <small>Pool ID</small>
                  <code>{poolId.slice(0, 20)}...</code>
                </div>
              )}
              <div className="reward-preview">
                <span>Tahmini ödülünüz:</span>
                <strong style={{ color: '#f9ab00' }}>~{selectedLocation.reward} $MONECO</strong>
              </div>
              <button className="btn btn-outline" onClick={handleReset}>Yeni Fotoğraf Yükle</button>
            </div>
          )}

          {step === 'error' && (
            <div className="status-card error">
              <div className="status-indicator error"><XIcon /></div>
              <h3>{errorMsg?.includes('sahte') ? 'Fotoğraf Reddedildi' : 'Bir Hata Oluştu'}</h3>
              <p>{errorMsg ?? 'AI kontrolü fotoğrafı geçersiz saydı.'}</p>
              <button className="btn btn-outline" onClick={handleReset}>Tekrar Dene</button>
            </div>
          )}

          {errorMsg && step === 'select' && <p className="error-text">{errorMsg}</p>}
        </div>
      )}

      <div className="rules-box">
        <h4>Toplayıcı Kuralları</h4>
        <ul>
          <li>Fotoğraf gerçek, yerinde çekilmiş olmalıdır</li>
          <li>AI üretimi veya sahte fotoğraf → 1000 $MONECO stake kesilir</li>
          <li>Geçerli fotoğraf → havuzdan ödül + seviye puanı</li>
          <li>İzbe bölgeler daha yüksek ödül sunar (yeşil noktalar)</li>
        </ul>
      </div>
    </div>
  );
};
