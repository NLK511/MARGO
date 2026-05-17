import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CarouselBlock } from './carousel-block';

describe('CarouselBlock', () => {
  it('renders slides and actions without a status badge', () => {
    const html = renderToStaticMarkup(
      <CarouselBlock
        title="Featured"
        body="Highlights"
        preset="cards"
        visibleCount={2}
        mode="manual"
        style="snap"
        autoAdvanceMs={3200}
        slides={[
          { title: 'First slide', body: 'First body', ctaLabel: 'Learn more', ctaHref: '/first' },
          { title: 'Second slide', eyebrow: 'Featured', body: 'Second body' },
          { title: 'Third slide', body: 'Third body' },
        ]}
        actions={[{ label: 'See all', href: '/all', kind: 'primary' }]}
      />,
    );

    expect(html).toContain('carousel-block');
    expect(html).toContain('carousel-slide');
    expect(html).toContain('Learn more');
    expect(html).toContain('See all');
    expect(html).toContain('carousel-slide-eyebrow');
    expect(html).not.toContain('carousel-chip');
    expect(html).not.toContain('carousel-status');
  });
});
