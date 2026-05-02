import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import logoUrl from '../../images/favicons/litroute.svg';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-char/8 bg-parchment">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2"
          aria-label="LitRoute home"
        >
          <img src={logoUrl} alt="" aria-hidden="true" className="h-12 w-12" />
          <span className="font-heading text-2xl font-bold tracking-tight">
            <span className="text-amber">Lit</span>
            <span className="text-char">Route</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          <NavLinks isAuthenticated={isAuthenticated} />
        </nav>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-md md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          <span
            className={`block h-0.5 w-5 bg-char transition-transform duration-200 ${open ? 'translate-y-2 rotate-45' : ''}`}
          />
          <span
            className={`block h-0.5 w-5 bg-char transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
          />
          <span
            className={`block h-0.5 w-5 bg-char transition-transform duration-200 ${open ? '-translate-y-2 -rotate-45' : ''}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-char/8 bg-parchment px-6 pb-4 md:hidden">
          <nav
            className="flex flex-col gap-1 pt-2"
            aria-label="Mobile navigation"
          >
            <MobileNavLinks
              isAuthenticated={isAuthenticated}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </div>
      )}
    </header>
  );
}

// ── Desktop links ────────────────────────────────────────────────────────────

function NavLinks({ isAuthenticated }: { isAuthenticated: boolean }) {
  const linkClass =
    'text-sm font-medium text-char/70 transition-colors hover:text-char';

  return (
    <>
      <Link to="/about/" className={linkClass}>
        About
      </Link>
      {isAuthenticated ? (
        <Link
          to="/profile/"
          className="rounded-btn border border-char/20 px-[18px] py-[7px] text-sm font-semibold text-char transition-colors hover:border-char/40 hover:bg-char/5"
        >
          Profile
        </Link>
      ) : (
        <Link
          to="/accounts/login/"
          className="rounded-btn bg-amber px-[18px] py-[7px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0"
        >
          Sign in
        </Link>
      )}
    </>
  );
}

// ── Mobile links ─────────────────────────────────────────────────────────────

function MobileNavLinks({
  isAuthenticated,
  onNavigate,
}: {
  isAuthenticated: boolean;
  onNavigate: () => void;
}) {
  const linkClass =
    'block rounded-md px-2 py-2.5 text-sm font-medium text-char/80 transition-colors hover:bg-linen hover:text-char';

  return (
    <>
      <Link to="/about/" className={linkClass} onClick={onNavigate}>
        About
      </Link>
      {isAuthenticated ? (
        <Link to="/profile/" className={linkClass} onClick={onNavigate}>
          Profile
        </Link>
      ) : (
        <Link to="/accounts/login/" className={linkClass} onClick={onNavigate}>
          Sign in
        </Link>
      )}
    </>
  );
}
