import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface GlobePin {
  lat: number;
  lng: number;
}

export function SpinningGlobe({ pins }: { pins: GlobePin[] }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!canvasRef.current) return;
    let raf = 0;
    // locationToAngles(20°N, 10°E) → central Europe, low tilt
    let phi = Math.PI - ((10 * Math.PI) / 180 - Math.PI / 2);
    const theta = (20 * Math.PI) / 180;
    let globe: ReturnType<typeof createGlobe> | undefined;
    let observer: IntersectionObserver | undefined;
    try {
      const isMobile = window.innerWidth < 640;
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: 800,
        height: 800,
        phi,
        theta,
        dark: 0,
        diffuse: 1.2,
        mapSamples: isMobile ? 8000 : 16000,
        mapBrightness: 6,
        baseColor: [0.93, 0.92, 0.9],
        markerColor: [0.91, 0.63, 0.19],
        glowColor: [0.93, 0.92, 0.9],
        markerElevation: 0,
        markers: pins.map((p) => ({
          location: [p.lat, p.lng] as [number, number],
          size: 0.04,
        })),
      });
      if (!reducedMotion) {
        const SPEED = 0.003;
        const animate = () => {
          phi += SPEED;
          globe!.update({ phi });
          raf = requestAnimationFrame(animate);
        };
        observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              if (!raf) raf = requestAnimationFrame(animate);
            } else {
              cancelAnimationFrame(raf);
              raf = 0;
            }
          },
          { threshold: 0 },
        );
        observer.observe(canvasRef.current!);
      }
    } catch {
      // WebGL unavailable — canvas hidden gracefully
    }
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      globe?.destroy();
    };
  }, [pins, reducedMotion]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: 'min(420px, 90vw)', height: 'min(420px, 90vw)' }}
        width={1200}
        height={1200}
        className="opacity-80"
      />
      <p className="mt-3 text-xs font-medium uppercase tracking-widest text-white/30">
        {t('home.globeCaption')}
      </p>
    </div>
  );
}
