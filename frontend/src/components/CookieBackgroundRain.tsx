import React, { useMemo } from 'react';
import { assetUrl } from '../config/api';

interface CookieBackgroundRainProps {
  themeMode?: 'light' | 'dark';
}

interface ParticleConfig {
  id: number;
  left: number; // percentage 0 - 100
  size: number; // in pixels
  duration: number; // seconds
  delay: number; // negative seconds for instant distribution
  opacity: number;
  animationType: 1 | 2;
}

export const CookieBackgroundRain: React.FC<CookieBackgroundRainProps> = React.memo(({ themeMode = 'light' }) => {
  const isDark = themeMode === 'dark';

  // 14 carefully tuned particles: sparse, delicate, and evenly distributed across the screen
  const particles: ParticleConfig[] = useMemo(() => [
    { id: 1, left: 4, size: 24, duration: 22, delay: -3, opacity: isDark ? 0.18 : 0.26, animationType: 1 },
    { id: 2, left: 12, size: 28, duration: 26, delay: -14, opacity: isDark ? 0.15 : 0.22, animationType: 2 },
    { id: 3, left: 19, size: 20, duration: 19, delay: -8, opacity: isDark ? 0.20 : 0.28, animationType: 1 },
    { id: 4, left: 27, size: 30, duration: 25, delay: -19, opacity: isDark ? 0.16 : 0.24, animationType: 2 },
    { id: 5, left: 35, size: 22, duration: 21, delay: -5, opacity: isDark ? 0.19 : 0.27, animationType: 1 },
    { id: 6, left: 43, size: 26, duration: 24, delay: -16, opacity: isDark ? 0.17 : 0.25, animationType: 2 },
    { id: 7, left: 51, size: 20, duration: 20, delay: -11, opacity: isDark ? 0.21 : 0.30, animationType: 1 },
    { id: 8, left: 59, size: 28, duration: 27, delay: -2, opacity: isDark ? 0.15 : 0.23, animationType: 2 },
    { id: 9, left: 67, size: 22, duration: 22, delay: -15, opacity: isDark ? 0.18 : 0.26, animationType: 1 },
    { id: 10, left: 75, size: 30, duration: 28, delay: -9, opacity: isDark ? 0.16 : 0.24, animationType: 2 },
    { id: 11, left: 83, size: 24, duration: 21, delay: -21, opacity: isDark ? 0.19 : 0.28, animationType: 1 },
    { id: 12, left: 91, size: 26, duration: 25, delay: -6, opacity: isDark ? 0.17 : 0.25, animationType: 2 },
    { id: 13, left: 23, size: 25, duration: 23, delay: -24, opacity: isDark ? 0.18 : 0.25, animationType: 1 },
    { id: 14, left: 63, size: 27, duration: 26, delay: -12, opacity: isDark ? 0.16 : 0.22, animationType: 2 },
  ], [isDark]);

  const cookieSrc = isDark
    ? assetUrl('/agents/cyber_cookie_float_dark.png')
    : assetUrl('/cookie_float_light.png');

  const fallbackSrc = isDark
    ? '/agents/cyber_cookie_float_dark.png'
    : '/cookie_float_light.png';

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute top-0 ${
            p.animationType === 1 ? 'animate-cookie-fall-1' : 'animate-cookie-fall-2'
          }`}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        >
          <img
            src={cookieSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain pixelated"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackSrc;
            }}
          />
        </div>
      ))}
    </div>
  );
});
