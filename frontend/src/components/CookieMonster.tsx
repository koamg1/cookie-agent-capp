import React, { useEffect, useState } from 'react';
import { assetUrl } from '../config/api';

interface CookieMonsterProps {
  isBurning: boolean;
  isHoveringBurn: boolean;
  isSuccess: boolean;
  burnAmount: number;
}

export const CookieMonster: React.FC<CookieMonsterProps> = ({
  isBurning,
  isHoveringBurn,
  isSuccess,
  burnAmount
}) => {
  const [speech, setSpeech] = useState<string>("ME COOKIE MONSTER! Me hungry for $COOKIE!");

  useEffect(() => {
    if (isBurning) {
      const phrases = [
        "OM NOM NOM NOM! 🔥",
        "CRUNCH CRUNCH! ME EAT THE GAS!",
        "DELICIOUS DEFLATION! 🔥",
        "CHOMP CHOMP! MORE COOKIES PLEASE!"
      ];
      setSpeech(phrases[Math.floor(Math.random() * phrases.length)]);
    } else if (isSuccess) {
      setSpeech("BURRRRP! 🔥 Ahhh, that burned so good! +50 Karma!");
    } else if (isHoveringBurn) {
      setSpeech(`OOH! A snack of ${burnAmount} $COOKIE for ME?!`);
    } else {
      setSpeech("ME COOKIE MONSTER! Feed me $COOKIE tokens!");
    }
  }, [isBurning, isHoveringBurn, isSuccess, burnAmount]);

  return (
    <div className="relative flex flex-col items-center select-none py-2 h-[340px] justify-between">
      {/* Cartoon Comic Speech Bubble (Fixed height to prevent layout shift) */}
      <div className="relative mb-2 bg-white border-2 border-[#0b1f3a] rounded-2xl px-4 py-1.5 shadow-[0_3px_0_#0b1f3a] w-[260px] h-14 flex items-center justify-center text-center z-20">
        <span className="text-xs font-black text-[#0b1f3a] tracking-tight block leading-snug">
          {speech}
        </span>
        {/* Comic Tail */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#0b1f3a]" />
        <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
      </div>

      {/* Floating Animated Cookies Flying into Mouth during Burn */}
      {isBurning && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="absolute text-2xl animate-cookie-fly-1">🍪</div>
          <div className="absolute text-2xl animate-cookie-fly-2">🍪</div>
          <div className="absolute text-xl animate-cookie-fly-3">🍪</div>
          {/* Crumbs burst from the mouth */}
          <div className="absolute text-xs animate-crumb-1">🟤</div>
          <div className="absolute text-xs animate-crumb-2">🟤</div>
          <div className="absolute text-xs animate-crumb-3">🔥</div>
          <div className="absolute text-xs animate-crumb-4">🔥</div>
        </div>
      )}

      {/* Main Animated Cookie Monster Character */}
      <div className="relative w-52 h-56 sm:w-56 sm:h-60 flex items-center justify-center">
        {/* Glowing Furnace Backlight when burning */}
        {isBurning && (
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-amber-500 via-red-500 to-orange-500 blur-xl opacity-90 animate-pulse" />
        )}

        {/* Character Image Switcher */}
        <div
          className={`relative transition-all duration-200 ${
            isBurning
              ? 'scale-110'
              : isHoveringBurn
              ? 'scale-105 rotate-1'
              : 'hover:scale-102'
          }`}
        >
          {isBurning ? (
            /* ACTIVE CHOMPING ANIMATION (Real multi-frame eating animation with hand shoveling cookies into open mouth!) */
            <img
              src={assetUrl('cookie_eating_opt.webp')}
              alt="Cookie Monster actively chomping cookies"
              className="w-48 h-52 sm:w-52 sm:h-56 object-contain drop-shadow-[0_8px_16px_rgba(11,31,58,0.3)]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/cookie_eating_opt.webp';
              }}
            />
          ) : (
            /* LIVING IDLE ANIMATION (Blinking, moving mouth, holding cookie!) */
            <img
              src={assetUrl('cookie_idle_opt.webp')}
              alt="Cookie Monster holding cookie and breathing"
              className="w-48 h-52 sm:w-52 sm:h-56 object-contain drop-shadow-[0_8px_16px_rgba(11,31,58,0.2)]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/cookie_idle_opt.webp';
              }}
            />
          )}

          {/* Satisifed Burp Flame */}
          {isSuccess && (
            <div className="absolute top-[12%] right-[18%] pointer-events-none animate-bounce">
              <span className="text-2xl block">🔥</span>
            </div>
          )}
        </div>
      </div>

      {/* Official Mascot Tag */}
      <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbeafe] border-2 border-[#0b1f3a] shadow-[0_2px_0_#0b1f3a]">
        <span className="text-xs">🍪</span>
        <span className="text-[10px] font-black text-[#1e40af] uppercase tracking-wider">
          {isBurning ? "🔥 MUNCHING GAS TOKENS..." : "● LIVING COOKIE MONSTER"}
        </span>
      </div>
    </div>
  );
};
