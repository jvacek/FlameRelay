import createGlobe from 'cobe';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import arrowZSrc from '../assets/arrows/arrow-z.svg';
import hArrow1Src from '../assets/arrows/h-arrow-1.svg';
import hArrow2Src from '../assets/arrows/h-arrow-2.svg';
import hArrow3Src from '../assets/arrows/h-arrow-3.svg';
import scribbleDownSrc from '../assets/arrows/scribble-down.svg';
import scribbleUpSrc from '../assets/arrows/scribble-up.svg';
import berlinImg from '../assets/journey/berlin.webp';
import lisbonImg from '../assets/journey/lisbon.webp';
import brusselsImg from '../assets/journey/brussels.webp';
import LighterInput from '../components/LighterInput';

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

export default function Home() {
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
      <Hero />
      <JourneyPreview />
      <StatsBanner stats={stats} pins={pins} />
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
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: 'min(420px, 90vw)', height: 'min(420px, 90vw)' }}
        width={1200}
        height={1200}
        className="opacity-80"
      />
      <p className="mt-3 text-xs font-medium uppercase tracking-widest text-white/30">
        20 recently active lighters — each dot is someone&apos;s story
      </p>
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 pb-10 pt-16 text-center">
      {/* Eyebrow */}
      <p className="mb-5 text-sm font-medium uppercase tracking-widest text-smoke">
        Find it. Check in. Pass it on.
      </p>

      {/* Headline */}
      <h1 className="font-heading mb-6 max-w-2xl text-5xl font-bold leading-tight tracking-tight text-char sm:text-6xl lg:text-7xl">
        A lighter with a history. Add yours.
      </h1>

      {/* Sub-headline */}
      <p className="mb-6 max-w-md text-lg text-smoke">
        Find a lighter with a QR sticker. Scan it to discover everywhere
        it&rsquo;s been and everyone who held it. Leave your own note &mdash;
        then pass it on to the next stranger.
      </p>

      {/* Scribble annotation – mobile: above the form, arrow points down */}
      <div className="mb-3 flex justify-center sm:hidden">
        <div
          className="relative -translate-x-4"
          style={{ paddingBottom: '40px' }}
        >
          <Link
            to="/unit/john-93"
            className="font-handwriting inline-block text-base text-char/50 transition-colors hover:text-char/70"
            style={{
              transform: 'rotate(-3deg)',
              transformOrigin: 'left center',
            }}
          >
            try &ldquo;john-93&rdquo; to see an example
          </Link>
          <img
            src={scribbleDownSrc}
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 left-4 w-7"
          />
        </div>
      </div>

      {/* Search */}
      <form
        className="flex w-full max-w-[480px] flex-col items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const id = inputRef.current?.value.trim();
          if (id) navigate(`/unit/${id}/`);
        }}
      >
        <LighterInput inputRef={inputRef} />
        <button
          type="submit"
          className="rounded-btn bg-amber px-10 py-3 text-base font-semibold tracking-wide text-white shadow-sm transition-transform hover:-translate-y-px active:translate-y-0"
        >
          See the route
        </button>
      </form>

      {/* Scribble annotation – desktop: below the form, arrow points up */}
      <div className="mt-6 hidden justify-center sm:flex">
        <div
          className="relative -translate-x-10"
          style={{ paddingTop: '44px' }}
        >
          <img
            src={scribbleUpSrc}
            alt=""
            aria-hidden="true"
            className="absolute top-0 left-3 w-7"
          />
          <Link
            to="/unit/john-93"
            className="font-handwriting inline-block text-base text-char/50 transition-colors hover:text-char/70"
            style={{
              transform: 'rotate(-3deg)',
              transformOrigin: 'left center',
            }}
          >
            try &ldquo;john-93&rdquo; to see an example
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Stats banner ─────────────────────────────────────────────────────────────

function StatsBanner({
  stats,
  pins,
}: {
  stats: Stats | null;
  pins: GlobePin[];
}) {
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
        <div className="flex flex-col items-center gap-12">
          {/* Globe */}
          <SpinningGlobe pins={pins} />

          {/* Stats */}
          <dl className="grid w-full grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
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
      </div>
    </section>
  );
}

// ── Journey Preview ──────────────────────────────────────────────────────────

const JOURNEY_STOPS = [
  {
    location: 'Bar in Lisbon',
    name: 'Miguel',
    nameRotate: '-2deg',
    quote: 'Found this under a barstool. Leaving it for the next person.',
    img: lisbonImg,
    tilt: 'rotate(-2.5deg) translateY(-8px)',
  },
  {
    location: 'Airbnb in Berlin',
    name: 'Sophie',
    nameRotate: '-1deg',
    quote: 'A guest left this. Adding my stop before I fly home to Tokyo.',
    img: berlinImg,
    tilt: 'rotate(1.5deg) translateY(14px)',
  },
  {
    location: 'Coffee shop in Brussels',
    name: 'Alex',
    nameRotate: '-3deg',
    quote: 'Came all the way from Europe? Had to check in.',
    img: brusselsImg,
    tilt: 'rotate(-1deg) translateY(-4px)',
  },
];

// Horizontal dashed arrow used between cards
function HArrow({ src }: { src: string }) {
  return (
    <div className="w-10 shrink-0" aria-hidden="true">
      <img src={src} alt="" className="w-full" />
    </div>
  );
}

// Diagonal Z-connector used between the two rows of the mobile layout
function ZConnector({ src }: { src: string }) {
  return (
    <div className="w-full" aria-hidden="true">
      <img src={src} alt="" className="w-full" />
    </div>
  );
}

function JourneyPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const mobileSectionRef = useRef<HTMLDivElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
      const el = sectionRef.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setSectionVisible(true);
            obs.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      obs.observe(el);
      return () => obs.disconnect();
    }

    // Mobile: observe each card individually — only show when fully in view
    const observers: IntersectionObserver[] = [];
    const cards =
      mobileSectionRef.current?.querySelectorAll<HTMLDivElement>(
        '[data-mobile-card]',
      );
    cards?.forEach((el, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, i]));
            obs.disconnect();
          }
        },
        { threshold: 0.9 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const isCardVisible = (i: number) => sectionVisible || visibleCards.has(i);

  const cardClass = (i: number) => {
    if (isCardVisible(i)) return reducedMotion ? '' : 'journey-card';
    return 'opacity-0';
  };

  const cardStyle = (i: number): React.CSSProperties | undefined => {
    if (!isCardVisible(i) || reducedMotion) return undefined;
    // Desktop stagger; mobile cards appear immediately (scroll provides natural stagger)
    if (sectionVisible) return { animationDelay: `${i * 300}ms` };
    return undefined;
  };

  const renderCard = (
    stop: (typeof JOURNEY_STOPS)[0],
    i: number,
    isMobile?: boolean,
  ) => (
    <div
      data-mobile-card={isMobile ? 'true' : undefined}
      className={`${cardClass(i)} overflow-hidden rounded-card bg-linen shadow-card`}
      style={cardStyle(i)}
    >
      <img
        src={stop.img}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="aspect-[3/4] w-full object-cover"
      />
      <div className="p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-smoke/70">
          {stop.location}
        </p>
        <p className="mb-3 text-xs leading-relaxed text-char/60">
          &ldquo;{stop.quote}&rdquo;
        </p>
        <div className="flex justify-end">
          <span
            className="font-handwriting inline-block text-2xl text-char/80"
            style={{ transform: `rotate(${stop.nameRotate})` }}
          >
            {stop.name}
          </span>
        </div>
      </div>
    </div>
  );

  const renderOpenSlot = (isMobile?: boolean) => (
    <div
      data-mobile-card={isMobile ? 'true' : undefined}
      className={`${cardClass(3)} overflow-hidden rounded-card border-2 border-dashed border-amber/30 bg-linen shadow-card`}
      style={cardStyle(3)}
    >
      <div className="flex aspect-[3/4] w-full items-center justify-center bg-amber/5">
        <span className="font-heading text-5xl font-bold text-amber/20">?</span>
      </div>
      <div className="p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-smoke/40">
          Somewhere new
        </p>
        <p className="mb-3 text-xs leading-relaxed text-char/35">
          Find one, check in, and you could be here.
        </p>
        <div className="flex justify-end">
          <span className="font-handwriting inline-block text-2xl text-amber/40">
            your name here
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} className="overflow-hidden px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-center text-sm font-medium uppercase tracking-widest text-smoke/60">
          What a lighter&apos;s journey looks like
        </p>
        <h2 className="font-heading mb-8 text-center text-2xl font-bold text-char sm:text-3xl">
          Every check-in is a chapter.
        </h2>

        {/* Desktop: flex row, arrows sit between cards in the gap */}
        <div className="hidden items-center py-6 lg:flex">
          {JOURNEY_STOPS.map((stop, i) => (
            <Fragment key={stop.location}>
              <div
                className="flex-1"
                style={{ transform: reducedMotion ? undefined : stop.tilt }}
              >
                {renderCard(stop, i)}
              </div>
              <HArrow src={[hArrow1Src, hArrow2Src, hArrow3Src][i]} />
            </Fragment>
          ))}
          <div
            className="flex-1"
            style={{
              transform: reducedMotion
                ? undefined
                : 'rotate(2.5deg) translateY(10px)',
            }}
          >
            {renderOpenSlot()}
          </div>
        </div>

        {/* Mobile: two flex rows with arrows, Z-connector between rows */}
        <div ref={mobileSectionRef} className="py-6 lg:hidden">
          <div className="flex items-center">
            <div
              className="min-w-0 flex-1"
              style={{
                transform: reducedMotion ? undefined : JOURNEY_STOPS[0].tilt,
              }}
            >
              {renderCard(JOURNEY_STOPS[0], 0, true)}
            </div>
            <HArrow src={hArrow1Src} />
            <div
              className="min-w-0 flex-1"
              style={{
                transform: reducedMotion ? undefined : JOURNEY_STOPS[1].tilt,
              }}
            >
              {renderCard(JOURNEY_STOPS[1], 1, true)}
            </div>
          </div>
          <ZConnector src={arrowZSrc} />
          <div className="flex items-center">
            <div
              className="min-w-0 flex-1"
              style={{
                transform: reducedMotion ? undefined : JOURNEY_STOPS[2].tilt,
              }}
            >
              {renderCard(JOURNEY_STOPS[2], 2, true)}
            </div>
            <HArrow src={hArrow2Src} />
            <div
              className="min-w-0 flex-1"
              style={{
                transform: reducedMotion
                  ? undefined
                  : 'rotate(2.5deg) translateY(10px)',
              }}
            >
              {renderOpenSlot(true)}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-smoke">
          <Link
            to="/unit/john-93"
            className="font-medium text-amber underline-offset-2 hover:underline"
          >
            See a real lighter&apos;s journey →
          </Link>
        </p>
      </div>
    </section>
  );
}

// ── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    title: 'Find it.',
    body: "Spot a lighter with a QR sticker. Scan it, or type its ID on litroute.com. Every city, every hand it passed through — it's all there waiting for you.",
  },
  {
    n: '2',
    title: 'Check in.',
    body: "Drop a photo and a quick note. Your moment — where you were, what you saw — becomes a permanent chapter in the lighter's story.",
  },
  {
    n: '3',
    title: 'Pass it on.',
    body: 'Hand it to a stranger. Leave it at a coffee shop, a hostel, a trailhead. You decide the next chapter.',
  },
  {
    n: '4',
    title: 'Follow along.',
    body: 'Subscribe and get an email the next time someone finds it — wherever in the world that turns out to be. Low-stakes stalking of a piece of metal.',
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
            <li key={n}>
              <div className="mb-2 grid grid-cols-[auto_1fr] items-center gap-x-3">
                <span className="font-heading text-6xl leading-none font-bold text-amber/25">
                  {n}
                </span>
                <h3 className="font-heading text-xl font-semibold text-char">
                  {title}
                </h3>
              </div>
              <p className="text-justify text-sm leading-relaxed text-char/70">
                {body}
              </p>
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
          Start a journey.
        </h2>
        <p className="mb-8 text-base leading-relaxed text-smoke">
          I&rsquo;m Jonas, I made this while funemployed. Want to send a lighter
          into the world?{' '}
          <Link
            to="/about/"
            className="font-medium text-amber underline-offset-2 hover:underline"
          >
            Read the about page
          </Link>{' '}
          first &mdash; you&rsquo;ll need to get in touch before you start
          printing labels.
        </p>
        <Link
          to="/about/"
          className="text-sm font-semibold tracking-wide text-amber underline-offset-4 transition-colors hover:underline"
        >
          About the project →
        </Link>
      </div>
    </section>
  );
}
