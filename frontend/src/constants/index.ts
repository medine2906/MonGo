// ── Ağ Ayarları ─────────────────────────────────────────────
export const MONAD_CHAIN_ID = 10143; // Monad Testnet

export const MONAD_NETWORK = {
  chainId:       `0x${MONAD_CHAIN_ID.toString(16)}`,
  chainName:     'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls:       ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
};

// ── Sözleşme Adresleri (deploy sonrası güncellenecek) ────────
export const CONTRACT_ADDRESSES = {
  token:    '0x0000000000000000000000000000000000000001', // placeholder
  protocol: '0x0000000000000000000000000000000000000002', // placeholder
};

// ── Token Sabitleri ──────────────────────────────────────────
export const COLLECTOR_STAKE_AMOUNT = 1_000;   // $MONECO
export const BASE_REWARD_AMOUNT     = 1;        // $MONECO per fotoğraf

// ── Seviye Eşikleri (sözleşmeyle sync) ──────────────────────
export const LEVEL_THRESHOLDS = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];

// ── Zorluk → Ödül Haritası ($MONECO) ────────────────────────
export const DIFFICULTY_REWARDS: Record<number, number> = {
  1: 10,
  2: 25,
  3: 60,
  4: 150,
  5: 400,
};

// ── Marker Renk Eşikleri ─────────────────────────────────────
// uploadCount'a göre: 0-4 yeşil, 5-14 turuncu, 15+ kırmızı
export const COLOR_THRESHOLDS = {
  green:  { min: 0,  max: 4  },
  orange: { min: 5,  max: 14 },
  red:    { min: 15, max: Infinity },
};

export const MARKER_COLORS = {
  green:  '#00CC44',
  orange: '#FF8C00',
  red:    '#FF4444',
};

// ── Türkiye'deki gerçek şehir/ilçe koordinat kutuları ────────
// [minLng, minLat, maxLng, maxLat]
// Tüm bbox'lar deniz/boğaz alanlarından uzak tutulmuştur.
// Adalar (Gökçeada, Bozcaada) kaldırıldı — bbox'ları büyük ölçüde denizi kapsıyordu.
export const TURKEY_DISTRICTS = [
  // İstanbul
  { city: 'İstanbul',   district: 'Kadıköy',     bbox: [29.02, 40.978, 29.10, 41.020] },
  { city: 'İstanbul',   district: 'Beşiktaş',    bbox: [28.98, 41.035, 29.02, 41.075] },
  { city: 'İstanbul',   district: 'Üsküdar',     bbox: [29.02, 41.002, 29.08, 41.050] },
  { city: 'İstanbul',   district: 'Fatih',       bbox: [28.92, 41.002, 28.97, 41.040] },
  { city: 'İstanbul',   district: 'Bakırköy',    bbox: [28.862, 40.976, 28.905, 40.998] },
  // Ankara (tamamen iç bölge)
  { city: 'Ankara',     district: 'Çankaya',     bbox: [32.83, 39.88, 32.90, 39.93] },
  { city: 'Ankara',     district: 'Keçiören',    bbox: [32.84, 39.97, 32.92, 40.03] },
  { city: 'Ankara',     district: 'Mamak',       bbox: [32.90, 39.93, 32.98, 39.99] },
  // İzmir — kıyı hattı batıda; bbox batı sınırı kıyının doğusunda
  { city: 'İzmir',      district: 'Konak',       bbox: [27.140, 38.406, 27.180, 38.438] },
  { city: 'İzmir',      district: 'Bornova',     bbox: [27.19,  38.44,  27.27,  38.50 ] },
  // Çanakkale — kıyı ve boğaz kenarları sıkılaştırıldı
  // Asya yakası
  { city: 'Çanakkale',  district: 'Merkez',      bbox: [26.406, 40.140, 26.445, 40.162] }, // boğaz ~26.39'da
  { city: 'Çanakkale',  district: 'Biga',        bbox: [27.215, 40.225, 27.280, 40.275] },
  { city: 'Çanakkale',  district: 'Çan',         bbox: [27.035, 40.025, 27.100, 40.070] },
  { city: 'Çanakkale',  district: 'Lapseki',     bbox: [26.700, 40.350, 26.730, 40.372] }, // boğaz batısında
  { city: 'Çanakkale',  district: 'Bayramiç',    bbox: [26.600, 39.805, 26.665, 39.855] },
  { city: 'Çanakkale',  district: 'Yenice',      bbox: [27.405, 39.935, 27.470, 39.980] },
  { city: 'Çanakkale',  district: 'Ayvacık',     bbox: [26.396, 39.606, 26.450, 39.643] }, // Ege kıyısı batıda
  { city: 'Çanakkale',  district: 'Ezine',       bbox: [26.335, 39.792, 26.390, 39.832] },
  // Avrupa yakası — Gelibolu yarımadası
  { city: 'Çanakkale',  district: 'Gelibolu',    bbox: [26.658, 40.410, 26.692, 40.446] }, // boğaz doğuda ~26.698
  { city: 'Çanakkale',  district: 'Eceabat',     bbox: [26.330, 40.196, 26.350, 40.222] }, // boğaz doğuda ~26.357
  // Bursa (iç bölge)
  { city: 'Bursa',      district: 'Osmangazi',   bbox: [29.04, 40.18, 29.11, 40.23] },
  { city: 'Bursa',      district: 'Nilüfer',     bbox: [28.94, 40.21, 29.02, 40.27] },
  // Konya (izbe – yüksek ödül)
  { city: 'Konya',      district: 'Selçuklu',    bbox: [32.47, 37.88, 32.55, 37.94] },
  { city: 'Konya',      district: 'Ereğli',      bbox: [33.52, 37.48, 33.60, 37.54] },
  // Kars (çok izbe – en yüksek ödül)
  { city: 'Kars',       district: 'Merkez',      bbox: [43.06, 40.59, 43.14, 40.65] },
  { city: 'Ağrı',       district: 'Doğubayazıt', bbox: [44.06, 39.54, 44.14, 39.60] },
  // Muş
  { city: 'Muş',        district: 'Merkez',      bbox: [41.48, 38.73, 41.56, 38.79] },
  // Hakkari (en izbe)
  { city: 'Hakkari',    district: 'Yüksekova',   bbox: [44.26, 37.56, 44.34, 37.62] },
];
