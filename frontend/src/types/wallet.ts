export type WalletType =
  | 'Phantom'
  | 'Backpack'
  | 'OKX Wallet'
  | 'Solflare'
  | 'Magic Eden'
  | 'Coinbase Wallet'
  | 'Nightly'
  | 'Brave Wallet'
  | 'Session Key';

export interface WalletOption {
  id: string;
  name: WalletType;
  icon: string;
  badge?: string;
  description: string;
  bgIcon: string;
}

export interface NetworkStats {
  network: string;
  rpc_endpoint: string;
  slot: number | null;
  block_height: number | null;
  latest_blockhash: string;
  latency_ms: number;
}
