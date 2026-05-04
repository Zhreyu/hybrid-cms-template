'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const FALLBACK_DIMENSIONS = {
  width: 1600,
  height: 900,
} as const;

export function ClickableImage({
  src,
  alt,
  title,
  loading = 'lazy',
}: {
  src: string;
  alt: string;
  title?: string;
  loading?: 'eager' | 'lazy';
}) {
  const [open, setOpen] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const preloadPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!src) {
      setDimensions(null);
      preloadPromiseRef.current = null;
      return;
    }

    setDimensions(null);
    preloadPromiseRef.current = null;
  }, [src]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const resolvedDimensions = dimensions ?? FALLBACK_DIMENSIONS;

  function ensureDimensions() {
    if (!src || dimensions || preloadPromiseRef.current) return;

    preloadPromiseRef.current = new Promise((resolve) => {
      const image = new window.Image();

      image.onload = () => {
        setDimensions({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
        preloadPromiseRef.current = null;
        resolve();
      };

      image.onerror = () => {
        setDimensions(FALLBACK_DIMENSIONS);
        preloadPromiseRef.current = null;
        resolve();
      };

      image.src = src;
    });
  }

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          ensureDimensions();
          setOpen(true);
        }}
        onMouseEnter={ensureDimensions}
        onFocus={ensureDimensions}
        className="block w-full cursor-zoom-in"
      >
        <Image
          src={src}
          alt={alt}
          title={title}
          width={resolvedDimensions.width}
          height={resolvedDimensions.height}
          loading={loading}
          unoptimized
          className="h-auto max-w-full rounded-xl"
        />
      </button>
      {/* Portal avoids nesting the modal inside markdown-generated paragraphs. */}
      {open && mounted
        ? createPortal(
          <div className="fixed inset-0 z-[90] p-4">
            <button
              type="button"
              aria-label="Close image preview"
              className="absolute inset-0 bg-black/80"
              onClick={() => setOpen(false)}
            />
            <div className="pointer-events-none relative flex h-full max-h-full max-w-full items-center justify-center">
              <Image
                src={src}
                alt={alt}
                width={resolvedDimensions.width}
                height={resolvedDimensions.height}
                unoptimized
                sizes="100vw"
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
                className="pointer-events-auto rounded-xl shadow-2xl"
              />
            </div>
          </div>,
          document.body
        )
        : null}
    </>
  );
}
