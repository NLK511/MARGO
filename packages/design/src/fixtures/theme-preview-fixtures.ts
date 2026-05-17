export interface ThemePreviewFixture {
  id: string;
  title: string;
  description: string;
  pageType: 'homepage' | 'booking' | 'service-list' | 'cta' | 'rich-text' | 'image-overlay' | 'mobile-nav' | 'empty-state' | 'form-state';
}

export const themePreviewFixtures: readonly ThemePreviewFixture[] = [
  { id: 'homepage', title: 'Homepage', description: 'Full landing page composition.', pageType: 'homepage' },
  { id: 'booking', title: 'Booking page', description: 'Availability and booking flow preview.', pageType: 'booking' },
  { id: 'service-list', title: 'Service list', description: 'Service cards and structured offers.', pageType: 'service-list' },
  { id: 'cta', title: 'CTA', description: 'Single conversion band.', pageType: 'cta' },
  { id: 'rich-text', title: 'Rich text', description: 'Editorial copy block.', pageType: 'rich-text' },
  { id: 'image-overlay', title: 'Image overlay', description: 'Image-led composition with readable overlay.', pageType: 'image-overlay' },
  { id: 'mobile-nav', title: 'Mobile nav', description: 'Compact navigation preview.', pageType: 'mobile-nav' },
  { id: 'empty-state', title: 'Empty state', description: 'Graceful empty-data experience.', pageType: 'empty-state' },
  { id: 'form-state', title: 'Form state', description: 'Labelled input and helper state.', pageType: 'form-state' },
];
