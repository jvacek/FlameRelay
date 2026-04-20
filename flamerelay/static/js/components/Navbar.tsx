import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { logout } from '../lib/allauthApi';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-char/8 bg-parchment">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Brand */}
        <Link
          to="/"
          className="font-heading text-2xl font-bold tracking-tight"
          aria-label="LitRoute home"
        >
          <span className="text-amber">Lit</span>
          <span className="text-char">Route</span>
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
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const linkClass =
    'text-sm font-medium text-char/70 transition-colors hover:text-char';

  async function handleLogout() {
    try {
      await logout();
    } finally {
      await refresh();
      navigate('/');
    }
  }

  return (
    <>
      <Link to="/about/" className={linkClass}>
        About
      </Link>
      {isAuthenticated ? (
        <>
          <Link to="/profile/" className={linkClass}>
            Profile
          </Link>
          <button type="button" onClick={handleLogout} className={linkClass}>
            Sign out
          </button>
        </>
      ) : (
        <Link
          to="/accounts/login/"
          className="rounded-full bg-amber px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const linkClass =
    'block rounded-md px-2 py-2.5 text-sm font-medium text-char/80 transition-colors hover:bg-linen hover:text-char';

  async function handleLogout() {
    onNavigate();
    try {
      await logout();
    } finally {
      await refresh();
      navigate('/');
    }
  }

  return (
    <>
      <Link to="/about/" className={linkClass} onClick={onNavigate}>
        About
      </Link>
      {isAuthenticated ? (
        <>
          <Link to="/profile/" className={linkClass} onClick={onNavigate}>
            Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full text-left ${linkClass}`}
          >
            Sign out
          </button>
        </>
      ) : (
        <Link to="/accounts/login/" className={linkClass} onClick={onNavigate}>
          Sign in
        </Link>
      )}
    </>
  );
}
