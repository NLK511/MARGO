export const radiusTokens = {
  none: '0px',
  sm: '6px',
  md: '12px',
  lg: '18px',
  xl: '24px',
  pill: '999px',
} as const;

export type RadiusToken = keyof typeof radiusTokens;
export type RadiusPersonality = 'formal' | 'neutral' | 'soft' | 'playful';

export const radiusPersonalityMap: Record<RadiusPersonality, RadiusToken> = {
  formal: 'sm',
  neutral: 'md',
  soft: 'lg',
  playful: 'xl',
};
