import { HAIR_COLORS, SHIRT_COLORS, SKIN_TONES } from "@/game/config";
import type { Appearance } from "@/game/types";

export function Avatar({ a, size = 56, hat = false }: { a: Appearance; size?: number; hat?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0 rounded-2xl bg-secondary" aria-hidden>
      <path d="M10 64c2-14 11-20 22-20s20 6 22 20z" fill={SHIRT_COLORS[a.shirt]} />
      <circle cx="32" cy="28" r="13" fill={SKIN_TONES[a.skin]} />
      {hat ? (
        <>
          <ellipse cx="32" cy="18" rx="22" ry="4" fill="oklch(0.42 0.06 55)" />
          <path d="M20 18c0-9 5-12 12-12s12 3 12 12z" fill="oklch(0.42 0.06 55)" />
        </>
      ) : (
        <path d="M18 27c0-10 6-15 14-15s14 5 14 15c-3-5-8-7-14-7s-11 2-14 7z" fill={HAIR_COLORS[a.hair]} />
      )}
      <circle cx="27" cy="29" r="1.5" fill="oklch(0.2 0 0)" />
      <circle cx="37" cy="29" r="1.5" fill="oklch(0.2 0 0)" />
      <path d="M28 34q4 3 8 0" stroke="oklch(0.25 0 0)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}