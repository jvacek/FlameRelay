import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import scribbleDownSrc from '../../assets/arrows/scribble-down.svg';
import scribbleUpSrc from '../../assets/arrows/scribble-up.svg';
import LighterInput from './LighterInput';

const IDENTIFIER_RE = /^\w{3,}-\d{2,}$/;

interface FormatError {
  message: string;
  example: string | null;
}

function formatError(id: string): FormatError {
  const dashIdx = id.indexOf('-');
  if (dashIdx === -1) {
    const name = id.length >= 3 ? id.toUpperCase() : 'EMILY';
    return {
      message: 'Missing the dash — it should be a name, a dash, then a number.',
      example: `${name}-07`,
    };
  }
  const prefix = id.slice(0, dashIdx);
  const suffix = id.slice(dashIdx + 1);
  if (prefix.length < 3) {
    return {
      message: `The name before the dash is too short — it needs at least 3 letters (you typed "${prefix.toUpperCase()}").`,
      example: null,
    };
  }
  if (suffix.length === 0) {
    return {
      message: 'Nothing after the dash — add a 2-digit number.',
      example: `${prefix.toUpperCase()}-07`,
    };
  }
  if (/^\d$/.test(suffix)) {
    return {
      message: 'The number needs 2 digits.',
      example: `${prefix.toUpperCase()}-0${suffix}`,
    };
  }
  return {
    message: 'The part after the dash should be a number.',
    example: `${prefix.toUpperCase()}-07`,
  };
}

function LighterName({ id }: { id: string }) {
  return (
    <span className="font-handwriting uppercase text-base text-amber">
      {id}
    </span>
  );
}

export function Hero() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [inputError, setInputError] = useState<FormatError | null>(null);
  const [notFoundId, setNotFoundId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [errorKey, setErrorKey] = useState(0);

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
        onSubmit={async (e) => {
          e.preventDefault();
          const id = inputRef.current?.value.trim();
          if (!id) return;
          if (!IDENTIFIER_RE.test(id)) {
            setInputError(formatError(id));
            setErrorKey((k) => k + 1);
            return;
          }
          setNotFoundId(null);
          setChecking(true);
          try {
            const r = await fetch(`/api/units/${id}/`);
            if (r.status === 404) {
              setNotFoundId(id);
              setErrorKey((k) => k + 1);
              return;
            }
          } catch {
            // Network error — navigate and let the unit page handle it
          } finally {
            setChecking(false);
          }
          navigate(`/unit/${id}/`);
        }}
      >
        <LighterInput
          inputRef={inputRef}
          onInput={() => {
            setInputError(null);
            setNotFoundId(null);
          }}
        />
        <button
          type="submit"
          disabled={checking}
          className="rounded-btn bg-amber px-10 py-3 text-base font-semibold tracking-wide text-white shadow-sm transition-transform hover:-translate-y-px active:translate-y-0 disabled:opacity-60"
        >
          {checking ? 'Checking…' : 'See the route'}
        </button>
        {inputError && (
          <div
            key={errorKey}
            className="no-glow error-pop-anim w-full rounded-card bg-char px-5 py-4 text-center shadow-lg"
          >
            <p className="text-sm text-white/70">
              {inputError.message}
              {inputError.example && (
                <>
                  {' '}
                  Like <LighterName id={inputError.example} />.
                </>
              )}
            </p>
          </div>
        )}
        {notFoundId && (
          <div
            key={errorKey}
            className="no-glow error-pop-anim w-full rounded-card bg-char px-5 py-4 text-center shadow-lg"
          >
            <p className="font-medium text-white">
              That lighter&apos;s off the map.
            </p>
            <p className="mt-1 text-sm text-white/60">
              We couldn&apos;t find{' '}
              <LighterName id={notFoundId.toUpperCase()} />. Double-check the
              sticker &mdash; it should look like <LighterName id="EMILY-07" />.
            </p>
          </div>
        )}
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
