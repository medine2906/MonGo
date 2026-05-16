import React, { useState } from 'react';
import { WalletState } from '../types';
import { connectWallet, shortAddress } from '../hooks/useContract';

interface Props {
  walletState:    WalletState;
  setWalletState: (s: WalletState) => void;
}

export const WalletConnect: React.FC<Props> = ({ walletState, setWalletState }) => {
  const [connecting, setConnecting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const address = await connectWallet();
      const chainId = parseInt(
        await window.ethereum!.request({ method: 'eth_chainId' }) as string,
        16
      );
      setWalletState({ address, isConnected: true, chainId });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletState({ address: null, isConnected: false, chainId: null });
  };

  if (walletState.isConnected && walletState.address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-badge">
          <span className="wallet-dot" />
          <span className="wallet-address">{shortAddress(walletState.address)}</span>
          <span className="wallet-network">Monad Testnet</span>
        </div>
        <button className="btn btn-sm btn-outline" onClick={handleDisconnect}>
          Çıkış
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-disconnected">
      {error && <span className="wallet-error">{error}</span>}
      <button
        className="btn btn-primary btn-connect"
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting ? (
          <><span className="spinner" /> Bağlanıyor...</>
        ) : (
          'MetaMask ile Bağlan'
        )}
      </button>
    </div>
  );
};
