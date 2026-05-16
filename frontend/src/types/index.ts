export type UserRole = 'collector' | 'validator';
export type MarkerColor = 'red' | 'orange' | 'green';
export type ImageStatus = 'Pending' | 'AICheck' | 'ValidatorVote' | 'Approved' | 'Rejected';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
}

export interface UserInfo {
  role: number;          // 0=None, 1=Collector, 2=Validator
  level: number;         // 1-10
  correctAnswers: number;
  stakedAmount: string;  // wei string
  isSlashed: boolean;
  totalEarned: string;   // wei string
}

export interface ContainerLocation {
  id: string;
  latitude: number;
  longitude: number;
  locationName: string;
  district: string;
  city: string;
  uploadCount: number;   // kaç kişi fotoğraf yüklemiş
  reward: number;        // $MONECO cinsinden
  difficulty: number;    // 1-5
  markerColor: MarkerColor;
  poolId?: string;       // on-chain pool ID (varsa)
  photos?: string[];     // Doğrulanan fotoğrafların URL'leri
}

export interface ImagePoolData {
  poolId: string;
  imageHash: string;
  collector: string;
  locationName: string;
  reward: number;
  uploadCount: number;
  approveVotes: number;
  rejectVotes: number;
  status: ImageStatus;
  difficulty: number;
  submittedAt: number;
  ipfsUrl?: string;      // simülasyon için
  fullness?: number;     // doluluk oranı 0-100
}

export interface ValidatorVotePayload {
  poolId: string;
  vote: boolean;
}

export interface LevelInfo {
  currentLevel: number;
  correctAnswers: number;
  threshold: number;
  progress: number;       // 0-100
  remaining: number;
  rewardMultiplier: number; // örn: 1.15 (seviye 4 için)
}
