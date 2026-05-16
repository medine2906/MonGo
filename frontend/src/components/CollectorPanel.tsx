import React, { useState, useRef } from 'react';
import { ContainerLocation } from '../types';
import { submitImage } from '../hooks/useContract';
import { MARKER_COLORS } from '../constants';

interface Props {
  selectedLocation: ContainerLocation | null;
  walletAddress?:   string;
}

type UploadStep = 'select' | 'preview' | 'uploading' | 'aicheck' | 'success' | 'error';



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
          Haritadan bir konteyner noktasına tıklayın
        </div>
      )}

      {selectedLocation && (
        <div className="upload-section">
          {step === 'select' && (
            <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
              <p>Fotoğraf Yükle</p>
              <small>Maks. 10 MB</small>
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
              <div className="ai-icon-wrap">AI Kontrol</div>
              <h3>AI Ön Kontrol</h3>
              <div className="ai-progress-bar">
                <div className="ai-progress-fill" style={{ width: `${aiProgress}%` }} />
              </div>
              <small>{aiProgress < 40 ? 'Görsel analiz ediliyor...' : aiProgress < 70 ? 'Meta veri doğrulanıyor...' : 'Sonuç bekleniyor...'}</small>
            </div>
          )}

          {step === 'success' && (
            <div className="status-card success">
              <div className="status-indicator success">Başarılı</div>
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
              <div className="status-indicator error">Hata</div>
              <h3>{errorMsg?.includes('sahte') ? 'Fotoğraf Reddedildi' : 'Bir Hata Oluştu'}</h3>
              <p>{errorMsg ?? 'AI kontrolü fotoğrafı geçersiz saydı.'}</p>
              <button className="btn btn-outline" onClick={handleReset}>Tekrar Dene</button>
            </div>
          )}

          {errorMsg && step === 'select' && <p className="error-text">{errorMsg}</p>}
        </div>
      )}


    </div>
  );
};
