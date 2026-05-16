import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, MONAD_NETWORK } from '../constants';
import { UserInfo, LevelInfo } from '../types';
import { LEVEL_THRESHOLDS } from '../constants';

// ── Demo modu: sözleşmeler deploy edilmeden önce localStorage mock ──────────
const DEMO_STORAGE_KEY = 'moneco_demo_users';

function isDemoMode(): boolean {
  return (
    CONTRACT_ADDRESSES.protocol === '0x0000000000000000000000000000000000000002' ||
    CONTRACT_ADDRESSES.protocol === ''
  );
}

function getDemoUser(address: string): UserInfo | null {
  try {
    const raw = localStorage.getItem(`${DEMO_STORAGE_KEY}_${address.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setDemoUser(address: string, info: UserInfo) {
  localStorage.setItem(
    `${DEMO_STORAGE_KEY}_${address.toLowerCase()}`,
    JSON.stringify(info)
  );
}

// Minimal ABI — yalnızca kullanılan fonksiyonlar
const PROTOCOL_ABI = [
  'function registerAsCollector() external',
  'function registerAsValidator() external',
  'function submitImage(bytes32,int256,int256,string,uint8) external returns (bytes32)',
  'function castValidationVote(bytes32,bool) external',
  'function getUserInfo(address) external view returns (tuple(uint8 role,uint8 level,uint256 correctAnswers,uint256 stakedAmount,bool isSlashed,uint256 totalEarned))',
  'function getNextLevelInfo(address) external view returns (uint256,uint256,uint256)',
  'function getPoolCount() external view returns (uint256)',
  'function getAllPools() external view returns (bytes32[])',
  'function getPoolInfo(bytes32) external view returns (tuple(bytes32 imageHash,address collector,int256 latitude,int256 longitude,uint256 poolReward,uint256 validatorCount,uint256 approveVotes,uint256 rejectVotes,uint8 status,uint256 submittedAt,bool rewardDistributed,string locationName,uint8 difficulty))',
];

const TOKEN_ABI = [
  'function approve(address,uint256) external returns (bool)',
  'function balanceOf(address) external view returns (uint256)',
  'function allowance(address,address) external view returns (uint256)',
];

function getSigner() {
  if (!window.ethereum) throw new Error('MetaMask bulunamadı');
  const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
  return provider.getSigner();
}

function getProtocolContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESSES.protocol, PROTOCOL_ABI, signer);
}

function getTokenContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESSES.token, TOKEN_ABI, signer);
}

// ── Ağ kontrolü ─────────────────────────────────────────────
export async function switchToMonad(): Promise<void> {
  if (!window.ethereum) throw new Error('MetaMask bulunamadı');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_NETWORK.chainId }],
    });
  } catch (err: unknown) {
    if ((err as { code: number }).code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [MONAD_NETWORK],
      });
    } else {
      // Testnet'e geçiş başarısız — demo modda devam et (hata fırlatma)
      console.warn('Monad ağına geçilemedi, demo modda devam ediliyor.');
    }
  }
}

// ── Cüzdan Bağlantısı ────────────────────────────────────────
export async function connectWallet(): Promise<string> {
  if (!window.ethereum) throw new Error('MetaMask kurulu değil');
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  }) as string[];
  await switchToMonad();
  return accounts[0];
}

// ── Kayıt ────────────────────────────────────────────────────
export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const registerCollector = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Demo modu: localStorage'a kaydet
      if (isDemoMode()) {
        const signer  = await getSigner();
        const address = await signer.getAddress();
        await new Promise(r => setTimeout(r, 1200)); // tx simülasyonu
        setDemoUser(address, {
          role: 1, level: 1, correctAnswers: 0,
          stakedAmount: (1000n * 10n**18n).toString(),
          isSlashed: false, totalEarned: '0',
        });
        return;
      }
      // Gerçek mod
      const signer   = await getSigner();
      const token    = getTokenContract(signer);
      const protocol = getProtocolContract(signer);
      const stake    = ethers.parseEther('1000');
      const allowance = await token.allowance(await signer.getAddress(), CONTRACT_ADDRESSES.protocol);
      if (allowance < stake) {
        const tx = await token.approve(CONTRACT_ADDRESSES.protocol, stake);
        await tx.wait();
      }
      const tx = await protocol.registerAsCollector();
      await tx.wait();
    } catch (e: unknown) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerValidator = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (isDemoMode()) {
        const signer  = await getSigner();
        const address = await signer.getAddress();
        await new Promise(r => setTimeout(r, 1000));
        setDemoUser(address, {
          role: 2, level: 1, correctAnswers: 0,
          stakedAmount: '0', isSlashed: false, totalEarned: '0',
        });
        return;
      }
      const signer   = await getSigner();
      const protocol = getProtocolContract(signer);
      const tx = await protocol.registerAsValidator();
      await tx.wait();
    } catch (e: unknown) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const switchRole = useCallback(async (newRole: 'collector' | 'validator') => {
    setLoading(true); setError(null);
    try {
      if (isDemoMode()) {
        const signer  = await getSigner();
        const address = await signer.getAddress();
        await new Promise(r => setTimeout(r, 800));
        const currentUser = getDemoUser(address);
        if (currentUser) {
          currentUser.role = newRole === 'collector' ? 1 : 2;
          setDemoUser(address, currentUser);
        }
        return;
      }
      
      const signer   = await getSigner();
      const protocol = getProtocolContract(signer);
      
      if (newRole === 'collector') {
        const token    = getTokenContract(signer);
        const stake    = ethers.parseEther('1000');
        const allowance = await token.allowance(await signer.getAddress(), CONTRACT_ADDRESSES.protocol);
        if (allowance < stake) {
          const tx = await token.approve(CONTRACT_ADDRESSES.protocol, stake);
          await tx.wait();
        }
        const tx = await protocol.registerAsCollector();
        await tx.wait();
      } else {
        const tx = await protocol.registerAsValidator();
        await tx.wait();
      }
    } catch (e: unknown) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { registerCollector, registerValidator, switchRole, loading, error };
}

// ── Kullanıcı Bilgisi ────────────────────────────────────────
export async function fetchUserInfo(address: string): Promise<UserInfo | null> {
  // Demo modu önce kontrol
  if (isDemoMode()) {
    return getDemoUser(address);
  }
  try {
    const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
    const protocol = new ethers.Contract(CONTRACT_ADDRESSES.protocol, PROTOCOL_ABI, provider);
    const result   = await protocol.getUserInfo(address);
    return {
      role:           Number(result.role),
      level:          Number(result.level),
      correctAnswers: Number(result.correctAnswers),
      stakedAmount:   result.stakedAmount.toString(),
      isSlashed:      result.isSlashed,
      totalEarned:    result.totalEarned.toString(),
    };
  } catch {
    return null;
  }
}

// ── Seviye Bilgisi ───────────────────────────────────────────
export function computeLevelInfo(correctAnswers: number, level: number): LevelInfo {
  const idx       = level - 1;
  const threshold = idx < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[idx] : 0;
  const progress  = threshold > 0
    ? Math.min(100, Math.floor((correctAnswers / threshold) * 100))
    : 100;
  const remaining  = threshold > 0 ? Math.max(0, threshold - correctAnswers) : 0;
  const multiplier = 1 + (level - 1) * 0.05;
  return { currentLevel: level, correctAnswers, threshold, progress, remaining, rewardMultiplier: multiplier };
}

// ── Fotoğraf Gönderimi ───────────────────────────────────────
export async function submitImage(
  latitude:     number,
  longitude:    number,
  locationName: string,
  difficulty:   number,
  _imageFile:   File
): Promise<string> {
  const fakeHash = `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`;

  if (isDemoMode()) {
    await new Promise(r => setTimeout(r, 1500));
    return fakeHash;
  }

  const signer   = await getSigner();
  const protocol = getProtocolContract(signer);
  const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(`${locationName}${Date.now()}`));

  const tx = await protocol.submitImage(
    hashBytes,
    Math.round(latitude  * 1e6),
    Math.round(longitude * 1e6),
    locationName,
    difficulty
  );
  const receipt = await tx.wait();
  const event = receipt?.logs?.find(
    (log: { topics: string[] }) =>
      log.topics[0] === ethers.id('ImageSubmitted(bytes32,address,string)')
  );
  return event ? event.topics[1] : hashBytes;
}

// ── Doğrulayıcı Oyu ──────────────────────────────────────────
export async function castVote(poolId: string, approve: boolean): Promise<void> {
  if (isDemoMode()) {
    await new Promise(r => setTimeout(r, 800));
    return;
  }
  const signer   = await getSigner();
  const protocol = getProtocolContract(signer);
  const tx       = await protocol.castValidationVote(poolId, approve);
  await tx.wait();
}

// ── Yardımcılar ──────────────────────────────────────────────
export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export { isDemoMode };
