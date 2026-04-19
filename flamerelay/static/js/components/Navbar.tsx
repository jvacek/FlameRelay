import { useState } from 'react';
import { logout } from '../lib/allauthApi';

export interface NavbarProps {
  isAuthenticated: boolean;
  username: string;
  homeUrl: string;
  aboutUrl: string;
  loginUrl: string;
  profileUrl: string;
}

export default function Navbar({
  isAuthenticated,
  homeUrl,
  aboutUrl,
  loginUrl,
  profileUrl,
}: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-char/8 bg-parchment">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Brand */}
        <a
          href={homeUrl}
          className="font-heading text-xl font-bold tracking-tight"
          aria-label="LitRoute home"
        >
          <span className="text-amber">Lit</span>
          <span className="text-char">Route</span>
        </a>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          <NavLinks
            isAuthenticated={isAuthenticated}
            aboutUrl={aboutUrl}
            profileUrl={profileUrl}
            loginUrl={loginUrl}
          />
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
              aboutUrl={aboutUrl}
              profileUrl={profileUrl}
              loginUrl={loginUrl}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </div>
      )}
    </header>
  );
}

// ── Desktop links ────────────────────────────────────────────────────────────

interface LinkProps {
  isAuthenticated: boolean;
  aboutUrl: string;
  profileUrl: string;
  loginUrl: string;
}

function NavLinks({
  isAuthenticated,
  aboutUrl,
  profileUrl,
  loginUrl,
}: LinkProps) {
  const linkClass =
    'text-sm font-medium text-char/70 transition-colors hover:text-char';

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  return (
    <>
      <a href={aboutUrl} className={linkClass}>
        About
      </a>
      {isAuthenticated ? (
        <>
          <a href={profileUrl} className={linkClass}>
            Profile
          </a>
          <button type="button" onClick={handleLogout} className={linkClass}>
            Sign out
          </button>
        </>
      ) : (
        <a
          href={loginUrl}
          className="rounded-full bg-amber px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Sign in
        </a>
      )}
    </>
  );
}

// ── Mobile links ─────────────────────────────────────────────────────────────

function MobileNavLinks({
  isAuthenticated,
  aboutUrl,
  profileUrl,
  loginUrl,
  onNavigate,
}: LinkProps & { onNavigate: () => void }) {
  const linkClass =
    'block rounded-md px-2 py-2.5 text-sm font-medium text-char/80 transition-colors hover:bg-linen hover:text-char';

  async function handleLogout() {
    onNavigate();
    await logout();
    window.location.href = '/';
  }

  return (
    <>
      <a href={aboutUrl} className={linkClass} onClick={onNavigate}>
        About
      </a>
      {isAuthenticated ? (
        <>
          <a href={profileUrl} className={linkClass} onClick={onNavigate}>
            Profile
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full text-left ${linkClass}`}
          >
            Sign out
          </button>
        </>
      ) : (
        <a href={loginUrl} className={linkClass} onClick={onNavigate}>
          Sign in
        </a>
      )}
    </>
  );
}
