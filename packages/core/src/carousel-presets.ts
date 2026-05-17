export const carouselPresetOptions = ['cards', 'testimonials', 'offers', 'gallery'] as const;
export type CarouselPreset = (typeof carouselPresetOptions)[number];

export type CarouselSlide = {
  eyebrow?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const presetDefaults: Record<CarouselPreset, { visibleCount: number; scrollMode: 'manual' | 'auto'; scrollStyle: 'snap' | 'smooth'; autoAdvanceMs: number }> = {
  cards: { visibleCount: 3, scrollMode: 'manual', scrollStyle: 'snap', autoAdvanceMs: 3200 },
  testimonials: { visibleCount: 1, scrollMode: 'auto', scrollStyle: 'smooth', autoAdvanceMs: 3800 },
  offers: { visibleCount: 2, scrollMode: 'manual', scrollStyle: 'snap', autoAdvanceMs: 3200 },
  gallery: { visibleCount: 3, scrollMode: 'auto', scrollStyle: 'smooth', autoAdvanceMs: 4500 },
};

export function getCarouselPresetDefaults(preset: string): { visibleCount: number; scrollMode: 'manual' | 'auto'; scrollStyle: 'snap' | 'smooth'; autoAdvanceMs: number } {
  return presetDefaults[preset as CarouselPreset] ?? presetDefaults.cards;
}

export function getCarouselPresetSlides(preset: string): CarouselSlide[] {
  switch (preset) {
    case 'testimonials':
      return [
        { title: '“An exceptional evening”', body: 'A memorable room, thoughtful pacing, and impeccable service.' },
        { title: '“Our new favorite table”', body: 'Elegant dishes and a beautifully calm atmosphere.' },
        { title: '“Perfect for celebrations”', body: 'A polished experience from first greeting to final course.' },
      ];
    case 'offers':
      return [
        { title: 'Chef tasting menu', body: 'A refined tasting route for special evenings.', ctaLabel: 'Book now', ctaHref: '#contact' },
        { title: 'Salon reservations', body: 'Reserve a quiet room for your group or celebration.', ctaLabel: 'Learn more', ctaHref: '#contact' },
      ];
    case 'gallery':
      return [
        { title: 'Dining room', body: 'Atmospheric interiors with low light and layered textures.' },
        { title: 'Table setting', body: 'Every place setting is designed to feel considered.' },
        { title: 'Seasonal plates', body: 'Close-up views of the menu and seasonal composition.' },
      ];
    case 'cards':
    default:
      return [
        { title: 'Featured service', body: 'Highlight one offering with a short description.', ctaLabel: 'Learn more', ctaHref: '#services' },
        { title: 'A second highlight', body: 'Use this slot for another feature or announcement.', ctaLabel: 'Contact us', ctaHref: '#contact' },
      ];
  }
}

export function createCarouselPresetProps(preset: string, base: Record<string, unknown> = {}): Record<string, unknown> {
  const title = typeof base.title === 'string' && base.title.trim() ? base.title : 'Featured content';
  const body = typeof base.body === 'string' && base.body.trim() ? base.body : 'A scrollable content carousel.';

  return {
    title,
    body,
    ...getCarouselPresetConfig(preset),
  };
}

export function getCarouselPresetConfig(preset: string): Record<string, unknown> {
  const defaults = getCarouselPresetDefaults(preset);
  return {
    visibleCount: defaults.visibleCount,
    scrollMode: defaults.scrollMode,
    scrollStyle: defaults.scrollStyle,
    autoAdvanceMs: defaults.autoAdvanceMs,
    slides: getCarouselPresetSlides(preset),
  };
}
