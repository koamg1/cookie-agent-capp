import React from 'react';
import { WalletType } from '../types/wallet';

export const PhantomIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="128" height="128" rx="64" fill="#AB9FF2" />
    {/* Authentic Phantom Ghost Silhouette */}
    <path
      d="M106 63C106 39.804 87.196 21 64 21C40.804 21 22 39.804 22 63C22 81.385 33.87 97.025 50.37 102.58C52.96 103.45 55.45 101.44 55.45 98.76V94.06C55.45 92.33 56.31 90.7 57.75 89.84C61.68 87.44 66.86 87.44 70.79 89.84C72.23 90.7 73.09 92.33 73.09 94.06V98.76C73.09 101.44 75.58 103.45 78.17 102.58C94.67 97.025 106 81.385 106 63Z"
      fill="#FFFFFF"
    />
    {/* Characteristic Phantom Eyes */}
    <ellipse cx="50" cy="59" rx="6.5" ry="9" fill="#5340C6" />
    <ellipse cx="78" cy="59" rx="6.5" ry="9" fill="#5340C6" />
  </svg>
);

export const NightlyIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="128" height="128" rx="64" fill="#0C1021" />
    {/* Nightly Owl Silhouette */}
    <path
      d="M64 24C41.91 24 24 41.91 24 64C24 86.09 41.91 104 64 104C86.09 104 104 86.09 104 64C104 41.91 86.09 24 64 24Z"
      fill="#171C33"
    />
    <path
      d="M38 48C43 45 53 43 64 53C75 43 85 45 90 48C84 66 82 82 64 88C46 82 44 66 38 48Z"
      fill="#22294A"
    />
    {/* Glowing Eyes */}
    <circle cx="51" cy="62" r="11" fill="#38E1FF" />
    <circle cx="51" cy="62" r="5" fill="#0C1021" />
    <circle cx="77" cy="62" r="11" fill="#FF539B" />
    <circle cx="77" cy="62" r="5" fill="#0C1021" />
  </svg>
);

export const SolflareIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="128" height="128" rx="64" fill="#181320" />
    {/* Solflare Solar Flame Rings */}
    <path
      d="M64 24L75.5 49.5L103 45L88.5 69L107 88L79 89.5L72 116L58.5 92L32 101L41.5 75.5L21 61L47 54.5L46 27L64 24Z"
      fill="url(#solflare_grad)"
    />
    <circle cx="64" cy="64" r="22" fill="#181320" />
    <circle cx="64" cy="64" r="16" fill="url(#solflare_inner)" />
    <defs>
      <linearGradient id="solflare_grad" x1="21" y1="24" x2="107" y2="116" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF8533" />
        <stop offset="0.5" stopColor="#FC603E" />
        <stop offset="1" stopColor="#FFC83B" />
      </linearGradient>
      <linearGradient id="solflare_inner" x1="48" y1="48" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFC83B" />
        <stop offset="1" stopColor="#FC603E" />
      </linearGradient>
    </defs>
  </svg>
);

export const CoinbaseIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="64" cy="64" r="64" fill="#0052FF" />
    <rect x="36" y="36" width="56" height="56" rx="16" fill="#FFFFFF" />
    <rect x="52" y="52" width="24" height="24" rx="6" fill="#0052FF" />
  </svg>
);

export const SessionKeyIcon: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="128" height="128" rx="64" fill="#059669" />
    <path
      d="M74 38C61.85 38 52 47.85 52 60C52 63.35 52.75 66.52 54.09 69.36L34 89.45V102H46.55V93.55H55V85.09H63.45L67.64 80.91C70.48 82.25 73.65 83 77 83C89.15 83 99 73.15 99 61C99 48.85 89.15 38 77 38H74ZM78.5 56.5C75.46 56.5 73 54.04 73 51C73 47.96 75.46 45.5 78.5 45.5C81.54 45.5 84 47.96 84 51C84 54.04 81.54 56.5 78.5 56.5Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const WalletLogo: React.FC<{ wallet: WalletType; className?: string }> = ({ wallet, className = "w-full h-full" }) => {
  switch (wallet) {
    case 'Phantom':
      return <PhantomIcon className={className} />;
    case 'Nightly':
      return <NightlyIcon className={className} />;
    case 'Solflare':
      return <SolflareIcon className={className} />;
    case 'Coinbase Wallet':
      return <CoinbaseIcon className={className} />;
    case 'Session Key':
      return <SessionKeyIcon className={className} />;
    default:
      return <div className={`flex items-center justify-center text-3xl ${className}`}>🍪</div>;
  }
};
