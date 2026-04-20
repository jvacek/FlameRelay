import createGlobe from 'cobe';
import { useEffect, useRef, useState } from 'react';

interface Stats {
  active_unit_count: number;
  checkin_count: number;
  contributing_user_count: number;
  total_distance_traveled_km: number;
}

interface GlobePin {
  lat: number;
  lng: number;
}

interface HomeProps {
  lookupUrl: string;
}

export default function Home({ lookupUrl }: HomeProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pins, setPins] = useState<GlobePin[]>([]);

  useEffect(() => {
    fetch('/api/stats/')
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/globe-pins/')
      .then((r) => r.json())
      .then((data: { pins: GlobePin[] }) => setPins(data.pins))
      .catch(() => {});
  }, []);

  return (
    <main>
      <Hero lookupUrl={lookupUrl} pins={pins} />
      <StatsBanner stats={stats} />
      <HowItWorks />
      <Cta />
    </main>
  );
}

// ── Spinning Globe ────────────────────────────────────────────────────────────

function SpinningGlobe({ pins }: { pins: GlobePin[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!canvasRef.current) return;
    let raf: number;
    // locationToAngles(20°N, 10°E) → central Europe, low tilt
    let phi = Math.PI - ((10 * Math.PI) / 180 - Math.PI / 2);
    const theta = (20 * Math.PI) / 180;
    let globe: ReturnType<typeof createGlobe> | undefined;
    try {
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: 1200,
        height: 1200,
        phi,
        theta,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 16000,
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
        const SPEED_SLOW = 0.001; // radians/frame when pins are in view
        const SPEED_FAST = 0.007; // radians/frame over empty ocean
        const PIN_DENSITY_MAX = 4; // pins needed to reach minimum speed

        const pinsInView = (currentPhi: number) => {
          // Inverse of locationToAngles: recover the facing longitude from phi
          const facingLng = ((3 * Math.PI) / 2 - currentPhi) * (180 / Math.PI);
          return pins.filter((p) => {
            const d = Math.abs(((p.lng - facingLng + 540) % 360) - 180);
            return d < 90; // within the visible hemisphere
          }).length;
        };

        const animate = () => {
          const visible = pinsInView(phi);
          const t = Math.min(visible / PIN_DENSITY_MAX, 1);
          phi += SPEED_FAST + (SPEED_SLOW - SPEED_FAST) * t;
          globe!.update({ phi });
          raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
      }
    } catch {
      // WebGL unavailable — canvas hidden gracefully
    }
    return () => {
      cancelAnimationFrame(raf);
      globe?.destroy();
    };
  }, [pins, reducedMotion]);

  return (
    <div className="mt-12 flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: 'min(600px, 90vw)', height: 'min(600px, 90vw)' }}
        width={1200}
        height={1200}
        className="opacity-80"
      />
      <p className="mt-3 text-xs font-medium uppercase tracking-widest text-smoke/50">
        Last known locations of active lighters
      </p>
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ lookupUrl, pins }: { lookupUrl: string; pins: GlobePin[] }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="flex min-h-[82vh] flex-col items-center justify-center px-6 pb-16 pt-16 text-center">
      {/* Eyebrow */}
      <p className="mb-5 text-sm font-medium uppercase tracking-widest text-smoke">
        Pass it on.
      </p>

      {/* Headline */}
      <h1 className="font-heading mb-6 max-w-2xl text-5xl font-bold leading-tight text-char sm:text-6xl lg:text-7xl">
        Your lighter&rsquo;s been places.
      </h1>

      {/* Sub-headline */}
      <p className="mb-10 max-w-md text-lg text-smoke">
        Find a lighter with a QR sticker on it. Look it up. See where it&rsquo;s
        been, who&rsquo;s had it, and where it went next.
      </p>

      {/* Search */}
      <form
        method="get"
        action={lookupUrl}
        className="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          if (!inputRef.current?.value.trim()) e.preventDefault();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          name="identifier"
          placeholder="john-01"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Lighter identifier"
          className="min-w-0 flex-1 rounded-lg border border-char/15 bg-white px-4 py-3 text-sm text-char placeholder-smoke/60 shadow-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
        >
          See the route
        </button>
      </form>

      {/* Example link */}
      <p className="mt-5 text-sm text-smoke">
        Not sure what this is?{' '}
        <a
          href="/backend/unit/test-123"
          className="font-medium text-amber underline-offset-2 hover:underline"
        >
          See an example lighter
        </a>
      </p>

      {/* Globe */}
      <SpinningGlobe pins={pins} />
    </section>
  );
}

// ── Stats banner ─────────────────────────────────────────────────────────────

function StatsBanner({ stats }: { stats: Stats | null }) {
  function fmt(n: number | null | undefined): string {
    if (n == null) return '—';
    if (n >= 1000) return n.toLocaleString();
    return String(n);
  }

  const items = [
    { value: fmt(stats?.active_unit_count), label: 'active lighters' },
    { value: fmt(stats?.checkin_count), label: 'check-ins logged' },
    {
      value: fmt(stats?.contributing_user_count),
      label: 'people who checked in',
    },
    {
      value: stats?.total_distance_traveled_km
        ? `${Math.round(stats.total_distance_traveled_km).toLocaleString()} km`
        : '—',
      label: 'traveled so far',
    },
  ];

  return (
    <section className="bg-char px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-smoke/60">
          By the numbers
        </p>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {items.map(({ value, label }) => (
            <div key={label} className="text-center">
              <dt className="font-heading text-4xl font-bold text-amber sm:text-5xl">
                {value}
              </dt>
              <dd className="mt-2 text-sm text-smoke">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    title: 'Find it.',
    body: "Spot a lighter with a QR sticker. Scan it, or type the ID on litroute.xyz. See every place it's been before you.",
  },
  {
    n: '2',
    title: 'Check in.',
    body: "Drop a photo and a quick note about where you found it. Your location becomes part of the lighter's story.",
  },
  {
    n: '3',
    title: 'Pass it on.',
    body: "Hand it to a stranger. Leave it at a bar. Put it somewhere interesting. That's the whole game.",
  },
  {
    n: '4',
    title: 'Follow along.',
    body: 'Subscribe to get an email the next time someone finds it. Low-stakes stalking of a small piece of metal.',
  },
];

function HowItWorks() {
  return (
    <section className="bg-linen px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading mb-14 text-center text-3xl font-bold text-char sm:text-4xl">
          Here&rsquo;s the deal.
        </h2>
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, title, body }) => (
            <li key={n} className="flex flex-col">
              <span className="font-heading mb-5 text-5xl font-bold text-amber/30">
                {n}
              </span>
              <h3 className="font-heading mb-2 text-xl font-semibold text-char">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-char/70">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function Cta() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading mb-4 text-3xl font-bold text-char sm:text-4xl">
          Want to help?
        </h2>
        <p className="mb-8 text-base leading-relaxed text-smoke">
          I&rsquo;m Jonas, I made this while funemployed. You don&rsquo;t need
          to code to participate — get some lighters, put stickers on them, and
          hand them to strangers. Or{' '}
          <a
            href="/about/"
            className="font-medium text-amber underline-offset-2 hover:underline"
          >
            read the about page
          </a>{' '}
          if you want to know more.
        </p>
        <a
          href="/about/"
          className="inline-flex items-center gap-2 rounded-full border border-amber/30 px-6 py-3 text-sm font-medium text-amber transition-colors hover:bg-amber hover:text-white"
        >
          About the project →
        </a>
      </div>
    </section>
  );
}
