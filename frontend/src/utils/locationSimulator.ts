import { ContainerLocation, MarkerColor } from '../types';
import {
  TURKEY_DISTRICTS,
  COLOR_THRESHOLDS,
  DIFFICULTY_REWARDS,
} from '../constants';

// Belirli bir bbox içinde rastgele koordinat üretir
function randomCoordInBbox(bbox: number[]): [number, number] {
  const lng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
  const lat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
  return [lng, lat];
}

// uploadCount → marker rengi
function uploadCountToColor(count: number): MarkerColor {
  if (count <= COLOR_THRESHOLDS.green.max)  return 'green';
  if (count <= COLOR_THRESHOLDS.orange.max) return 'orange';
  return 'red';
}

// İlçenin coğrafi konumuna göre zorluk ata
// Uzak/doğu ilçeleri daha zor
const REMOTE_CITIES = ['Kars', 'Ağrı', 'Muş', 'Hakkari', 'Konya'];
const MID_CITIES    = ['Çanakkale', 'Bursa', 'İzmir'];

function getDifficulty(city: string, uploadCount: number): number {
  if (REMOTE_CITIES.includes(city)) {
    return uploadCount < 3 ? 5 : 4;
  }
  if (MID_CITIES.includes(city)) {
    return uploadCount < 5 ? 3 : 2;
  }
  return uploadCount < 5 ? 2 : 1;
}

// Ödülü uploadCount'a göre dinamik hesapla
// Az ziyaret edilmiş → yüksek difficulty → yüksek ödül
function calculateReward(difficulty: number, uploadCount: number): number {
  const base = DIFFICULTY_REWARDS[difficulty] ?? 10;
  // 0 upload → tam ödül, arttıkça düşüyor (minimum %10)
  const fraction = Math.max(0.1, 1 - uploadCount * 0.08);
  return Math.round(base * fraction * 10) / 10;
}

let _idCounter = 0;

export function generateSimulatedLocations(count: number): ContainerLocation[] {
  const locations: ContainerLocation[] = [];

  const districts = TURKEY_DISTRICTS;

  // Her ilçeye yaklaşık eşit sayıda nokta dağıt
  const perDistrict = Math.ceil(count / districts.length);

  for (const district of districts) {
    for (let i = 0; i < perDistrict && locations.length < count; i++) {
      const [lng, lat] = randomCoordInBbox(district.bbox);

      // Uzak şehirlerde çok az yükleme, yakın şehirlerde çok yükleme simüle et
      let maxUploads = REMOTE_CITIES.includes(district.city) ? 4 : 25;
      const uploadCount = Math.floor(Math.random() * maxUploads);
      const difficulty   = getDifficulty(district.city, uploadCount);
      const reward       = calculateReward(difficulty, uploadCount);
      const color        = uploadCountToColor(uploadCount);

      locations.push({
        id:           `loc_${++_idCounter}`,
        latitude:     parseFloat(lat.toFixed(6)),
        longitude:    parseFloat(lng.toFixed(6)),
        locationName: `${district.city} / ${district.district} - Konteyner #${_idCounter}`,
        district:     district.district,
        city:         district.city,
        uploadCount,
        reward,
        difficulty,
        markerColor:  color,
      });
    }
  }

  return locations;
}

export const DEMO_PENDING_POOLS = [
  {
    poolId:      '0xabc...001',
    imageHash:   '0xhash001',
    collector:   '0xCollector1',
    locationName:'İstanbul / Kadıköy - Konteyner #7',
    reward:      12,
    uploadCount: 1,
    approveVotes: 2,
    rejectVotes:  1,
    status:      'ValidatorVote' as const,
    difficulty:  2,
    submittedAt: Date.now() - 3600_000,
    ipfsUrl:     '/trash1.png',
    fullness:    100,
  },
  {
    poolId:      '0xabc...002',
    imageHash:   '0xhash002',
    collector:   '0xCollector2',
    locationName:'Çanakkale / Biga Belediyesi - Konteyner #42',
    reward:      100,
    uploadCount: 1,
    approveVotes: 1,
    rejectVotes:  0,
    status:      'ValidatorVote' as const,
    difficulty:  4,
    submittedAt: Date.now() - 7200_000,
    ipfsUrl:     '/trash2.png',
    fullness:    50,
  },
  {
    poolId:      '0xabc...003',
    imageHash:   '0xhash003',
    collector:   '0xCollector3',
    locationName:'Kars / Merkez - Konteyner #89',
    reward:      380,
    uploadCount: 1,
    approveVotes: 0,
    rejectVotes:  0,
    status:      'ValidatorVote' as const,
    difficulty:  5,
    submittedAt: Date.now() - 1800_000,
    ipfsUrl:     '/trash3.png',
    fullness:    10,
  },
];
