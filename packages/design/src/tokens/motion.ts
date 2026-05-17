export const motionTokens = {
  fast: '120ms',
  standard: '180ms',
  slow: '280ms',
} as const;

export const motionEasings = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;
