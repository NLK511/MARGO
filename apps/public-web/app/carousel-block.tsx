'use client';

import React, { useEffect, useRef, type CSSProperties } from 'react';

export type CarouselSlide = {
  eyebrow?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type CarouselMode = 'manual' | 'auto';
export type CarouselStyle = 'snap' | 'smooth';

export function CarouselBlock({
  title,
  body,
  preset,
  visibleCount,
  mode,
  style: carouselStyle,
  autoAdvanceMs,
  slides,
  actions,
  styleVars,
}: {
  title: string;
  body?: string;
  preset: string;
  visibleCount: number;
  mode: CarouselMode;
  style: CarouselStyle;
  autoAdvanceMs: number;
  slides: CarouselSlide[];
  actions?: Array<{ label: string; href: string; kind?: 'primary' | 'secondary' }>;
  styleVars?: React.CSSProperties;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canScroll = slides.length > visibleCount;

  const motionBehavior = carouselStyle === 'smooth' ? 'smooth' : 'auto';
  const slideBasis = `calc((100% - ${(visibleCount - 1) * 16}px) / ${visibleCount})`;
  const trackStyle = { ['--carousel-visible-count']: visibleCount } as CSSProperties & Record<string, string | number>;

  function scrollByStep(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const firstSlide = track.querySelector<HTMLElement>('.carousel-slide');
    if (!firstSlide) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    const step = firstSlide.getBoundingClientRect().width + gap;
    track.scrollBy({ left: step * direction, behavior: motionBehavior });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track || mode !== 'auto' || !canScroll) return;

    const interval = window.setInterval(() => {
      const maxScrollLeft = track.scrollWidth - track.clientWidth - 1;
      const atEnd = track.scrollLeft >= maxScrollLeft;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: motionBehavior });
        return;
      }
      scrollByStep(1);
    }, autoAdvanceMs);

    return () => window.clearInterval(interval);
  }, [autoAdvanceMs, canScroll, mode, motionBehavior]);

  return (
    <section className={`block carousel-block carousel-${preset}`} data-carousel-mode={mode} data-carousel-style={carouselStyle} data-carousel-visible={visibleCount} style={styleVars}>
      <div className="carousel-header">
        <div className="block-heading carousel-heading">
          <h2>{title}</h2>
        </div>
        {body ? <p className="carousel-intro">{body}</p> : null}
      </div>
      <div ref={trackRef} className="carousel-track" aria-label={title} style={trackStyle as React.CSSProperties}>
        {slides.map((slide, index) => (
          <article key={`${slide.title}-${index}`} className="carousel-slide" style={{ flex: `0 0 ${slideBasis}` }}>
            <div className="carousel-slide-image" style={slide.imageUrl ? { backgroundImage: `url('${slide.imageUrl.replace(/'/g, "\\'")}')` } : undefined} aria-hidden="true" />
            <div className="carousel-slide-body">
              {slide.eyebrow ? <p className="carousel-slide-eyebrow">{slide.eyebrow}</p> : null}
              <h3>{slide.title}</h3>
              {slide.body ? <p>{slide.body}</p> : null}
              {slide.ctaLabel ? (
                <a className="secondary-action" href={slide.ctaHref || '#'}>
                  {slide.ctaLabel}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {actions?.length ? (
        <div className="block-actions carousel-actions">
          {actions.map((action, index) => (
            <a key={`${action.label}-${index}`} className={action.kind === 'secondary' ? 'secondary-action' : 'primary-action'} href={action.href}>
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
      {canScroll ? (
        <div className="carousel-footer">
          <div className="carousel-toolbar" aria-label="Carousel controls">
            <button type="button" className="carousel-nav-button" onClick={() => scrollByStep(-1)} aria-label="Previous slide">
              ←
            </button>
            <button type="button" className="carousel-nav-button" onClick={() => scrollByStep(1)} aria-label="Next slide">
              →
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
