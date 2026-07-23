'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

export default function ScrollExpandMedia({
  mediaType = 'image',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand = 'Scroll to expand',
  textBlend = false,
  children,
}: ScrollExpandMediaProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const progressRef = useRef(0);
  const expandedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion) return;
    progressRef.current = 1;
    expandedRef.current = true;
    setScrollProgress(1);
    setExpanded(true);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const setProgress = (value: number) => {
      const next = Math.min(Math.max(value, 0), 1);
      progressRef.current = next;
      setScrollProgress(next);
      const nextExpanded = next >= 1;
      if (nextExpanded !== expandedRef.current) {
        expandedRef.current = nextExpanded;
        setExpanded(nextExpanded);
      }
    };

    const onWheel = (event: globalThis.WheelEvent) => {
      if (expandedRef.current) return;
      event.preventDefault();
      setProgress(progressRef.current + event.deltaY * 0.0012);
    };
    const onTouchStart = (event: globalThis.TouchEvent) =>
      setTouchStartY(event.touches[0]?.clientY ?? null);
    const onTouchMove = (event: globalThis.TouchEvent) => {
      if (expandedRef.current || touchStartY === null) return;
      const currentY = event.touches[0]?.clientY;
      if (currentY === undefined) return;
      event.preventDefault();
      setProgress(progressRef.current + (touchStartY - currentY) * 0.006);
      setTouchStartY(currentY);
    };
    const onTouchEnd = () => setTouchStartY(null);

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [touchStartY]);

  const mediaWidth = 300 + scrollProgress * (isMobile ? 650 : 1220);
  const mediaHeight = 360 + scrollProgress * (isMobile ? 220 : 420);
  const [firstWord = '', ...remainingWords] = title?.split(' ') ?? [];

  return (
    <section
      id="top"
      className="relative min-h-dvh overflow-x-hidden bg-background"
    >
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: 1 - scrollProgress * 0.9 }}
        transition={{ duration: 0.12 }}
      >
        <Image
          src={bgImageSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-background/80" />
      </motion.div>
      <div className="relative mx-auto flex min-h-dvh max-w-360 flex-col items-center justify-center px-5 py-16 sm:px-8">
        <div
          className={`relative z-10 mb-8 text-center ${textBlend ? 'mix-blend-multiply' : ''}`}
        >
          {date ? (
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-primary sm:text-sm">
              {date}
            </p>
          ) : null}
          <h1 className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-6xl lg:text-7xl">
            <span className="block">{firstWord}</span>
            <span className="block">{remainingWords.join(' ')}</span>
          </h1>
        </div>

        <motion.div
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          animate={{ width: mediaWidth, height: mediaHeight }}
          transition={{ type: 'spring', stiffness: 115, damping: 24 }}
          style={{ maxWidth: '94vw', maxHeight: '72dvh' }}
        >
          {mediaType === 'video' ? (
            <video
              src={mediaSrc}
              poster={posterSrc}
              autoPlay
              muted
              loop
              playsInline
              className="size-full object-cover"
            />
          ) : (
            <Image
              src={mediaSrc}
              alt={title ?? 'Flowbase workspace'}
              fill
              sizes="(max-width: 768px) 94vw, 1220px"
              className="object-cover"
              priority
            />
          )}
          <motion.div
            className="absolute inset-0 bg-foreground/20"
            animate={{ opacity: 0.48 - scrollProgress * 0.34 }}
          />
        </motion.div>

        <motion.button
          type="button"
          onClick={() => {
            progressRef.current = 1;
            expandedRef.current = true;
            setScrollProgress(1);
            setExpanded(true);
          }}
          className="relative z-10 mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary/70"
          animate={{ opacity: expanded ? 0 : 1 }}
          aria-label="Expand the Flowbase preview"
        >
          {scrollToExpand}
        </motion.button>
      </div>
      <motion.div
        className="relative mx-auto max-w-4xl px-5 pb-20 sm:px-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: expanded ? 1 : 0, y: expanded ? 0 : 18 }}
        transition={{ duration: 0.45 }}
        aria-hidden={!expanded}
      >
        {children}
      </motion.div>
    </section>
  );
}
