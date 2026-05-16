import React, { useState, useRef } from 'react';
import { ContainerLocation } from '../types';
import { submitImage } from '../hooks/useContract';
import { MARKER_COLORS } from '../constants';

interface Props {
  selectedLocation: ContainerLocation | null;
  walletAddress?:   string;
  onPhotoUploaded?: (photoUrl: string, fullness: number) => void;
}

type UploadStep = 'select' | 'preview' | 'uploading' | 'aicheck' | 'success' | 'error';



export const CollectorPanel: React.FC<Props> = ({ selectedLocation, walletAddress, onPhotoUploaded }) => {
  const [step,       setStep]       = useState<UploadStep>('select');
  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [poolId,     setPoolId]     = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);
  const [aiProgress,    setAiProgress]    = useState(0);
  const [pollutionLevel, setPollutionLevel] = useState<number>(0);
  const [envQuality,     setEnvQuality]    = useState<'clean' | 'moderate' | 'polluted' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRandomNaturePhoto = async () => {
    try {
      const response = await fetch(`https://loremflickr.com/800/600/nature,environment?random=${Math.random()}`);
      const blob = await response.blob();
      const file = new File([blob], "cevre_foto.jpg", { type: "image/jpeg" });
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep('preview');
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg('Fotoğraf çekilirken hata oluştu.');
    }
  };

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
        selectedLocation.locationName, selectedLocation.difficulty, 0, imageFile
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
        setTimeout(() => {
          // %15 ihtimalle yapay/sahte fotoğraf olarak reddedilir
          const isRealPhoto = Math.random() > 0.15;
          if (!isRealPhoto) {
            setStep('error');
            setErrorMsg('Fotoğraf gerçek bir çevre görüntüsü değil.');
            return;
          }
          // AI kirlilik seviyesi belirler: temiz %50, orta %30, kirli %20
          const rand = Math.random();
          let level: number;
          let quality: 'clean' | 'moderate' | 'polluted';
          if (rand < 0.5) { level = Math.floor(Math.random() * 30);       quality = 'clean';    }
          else if (rand < 0.8) { level = 30 + Math.floor(Math.random() * 40); quality = 'moderate'; }
          else { level = 70 + Math.floor(Math.random() * 30);              quality = 'polluted'; }
          setPollutionLevel(level);
          setEnvQuality(quality);
          setStep('success');
          if (previewUrl && onPhotoUploaded) {
            onPhotoUploaded(previewUrl, level);
          }
        }, 500);
      }
    }, 200);
  };

  const handleReset = () => {
    setStep('select'); setImageFile(null); setPreviewUrl(null);
    setPoolId(null); setErrorMsg(null); setAiProgress(0);
    setPollutionLevel(0); setEnvQuality(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getColorStyle = (color: ContainerLocation['markerColor']) => ({
    color: MARKER_COLORS[color], borderColor: MARKER_COLORS[color],
  });

  return (
    <div className="panel collector-panel">
      <div className="panel-header">
        <h2>Çevre Fotoğrafı Gönder</h2>
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

        </div>
      ) : (
        <div className="no-location-hint">
          Haritadan bir çevre noktasına tıklayın
        </div>
      )}

      {selectedLocation && (
        <div className="upload-section">
          {step === 'select' && (
            <div className="drop-zone" onClick={fetchRandomNaturePhoto} style={{ cursor: 'pointer' }}>
              <p>Bulunduğunuz Çevreyi Fotoğraflayın</p>
              <small>AI kirlilik seviyesini otomatik belirleyecek</small>
            </div>
          )}

          {step === 'preview' && previewUrl && (
            <div className="preview-section">
              <img src={previewUrl} alt="Önizleme" className="preview-image" />
              <div className="preview-meta">
                <span>{imageFile?.name}</span>
                <span>{((imageFile?.size ?? 0) / 1024).toFixed(0)} KB</span>
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: 'var(--bg-2)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-2)' }}>
                AI, fotoğrafın gerçek bir çevre görüntüsü olup olmadığını ve kirlilik seviyesini otomatik analiz edecek.
              </div>
              <div className="preview-actions" style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={handleReset}>Yeniden Seç</button>
                <button className="btn btn-primary"   onClick={handleUpload}>Gönder</button>
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
              <div className="ai-icon-wrap">AI Analiz</div>
              <h3>Çevre Analizi</h3>
              <div className="ai-progress-bar">
                <div className="ai-progress-fill" style={{ width: `${aiProgress}%` }} />
              </div>
              <small>
                {aiProgress < 35 ? 'Fotoğraf gerçekliği doğrulanıyor...'
                  : aiProgress < 65 ? 'Çevre içeriği analiz ediliyor...'
                  : 'Kirlilik seviyesi belirleniyor...'}
              </small>
            </div>
          )}

          {step === 'success' && (
            <div className="status-card success">
              <div className="status-indicator success">Onaylandı</div>
              <h3>Çevre Fotoğrafı Doğrulandı</h3>
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, background: envQuality === 'clean' ? 'rgba(52,168,83,0.12)' : envQuality === 'polluted' ? 'rgba(220,53,69,0.12)' : 'rgba(255,152,0,0.12)', display: 'inline-block' }}>
                <span style={{ fontWeight: 600, color: envQuality === 'clean' ? '#34a853' : envQuality === 'polluted' ? '#dc3545' : '#ff9800' }}>
                  {envQuality === 'clean' ? '🟢 Temiz Çevre' : envQuality === 'polluted' ? '🔴 Kirli Çevre' : '🟠 Orta Kirlilik'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginLeft: 6 }}>Kirlilik: %{pollutionLevel}</span>
              </div>
              <p style={{ marginTop: '0.5rem' }}>Fotoğraf havuza eklendi, doğrulayıcılar oylayacak.</p>
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
              <button className="btn btn-outline" onClick={handleReset}>Yeni Fotoğraf Gönder</button>
            </div>
          )}

          {step === 'error' && (
            <div className="status-card error">
              <div className="status-indicator error">Reddedildi</div>
              <h3>Fotoğraf Doğrulanamadı</h3>
              <p>{errorMsg ?? 'AI fotoğrafı geçerli bir çevre görüntüsü olarak tanıyamadı.'}</p>
              <button className="btn btn-outline" onClick={handleReset}>Tekrar Dene</button>
            </div>
          )}

          {errorMsg && step === 'select' && <p className="error-text">{errorMsg}</p>}
        </div>
      )}


    </div>
  );
};
