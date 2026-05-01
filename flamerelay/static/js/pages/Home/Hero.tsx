import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import scribbleDownSrc from '../../assets/arrows/scribble-down.svg';
import scribbleUpSrc from '../../assets/arrows/scribble-up.svg';
import LighterInput from './LighterInput';

export function Hero() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  return (
    <section className="parchment-glow flex min-h-[60vh] flex-col items-center justify-center px-6 pb-10 pt-16 text-center">
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
