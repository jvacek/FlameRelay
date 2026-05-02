import { Link } from 'react-router-dom';
import logoUrl from '../../images/favicons/litroute.svg';

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 fill-current"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-current"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-current"
      aria-hidden="true"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

export default function Footer() {
  const commitUrl = __GIT_COMMIT__
    ? `${__GITHUB_REPO_URL__}/commit/${__GIT_COMMIT__}`
    : __GITHUB_REPO_URL__;

  return (
    <footer className="mt-16 border-t border-char/10 bg-parchment py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Link
            to="/"
            className="flex items-center gap-2"
            aria-label="LitRoute home"
          >
            <img src={logoUrl} alt="" aria-hidden="true" className="h-8 w-8" />
            <span className="font-heading text-lg font-bold tracking-tight">
              <span className="text-amber">Lit</span>
              <span className="text-char">Route</span>
            </span>
          </Link>
          <p className="text-xs text-char/50">
            Track your lighter&apos;s journey
          </p>
        </div>

        <nav
          className="flex flex-col gap-2 sm:items-center"
          aria-label="Footer navigation"
        >
          <Link
            to="/about/"
            className="text-xs text-char/60 transition-colors hover:text-char"
          >
            About
          </Link>
          <Link
            to="/privacy/"
            className="text-xs text-char/60 transition-colors hover:text-char"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms/"
            className="text-xs text-char/60 transition-colors hover:text-char"
          >
            Terms of Service
          </Link>
        </nav>

        <div className="flex flex-col gap-2 sm:items-end">
          <span className="text-xs text-char/50">&copy; 2026 LitRoute</span>
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/lit_route"
              target="_blank"
              rel="noopener noreferrer"
              className="text-char/40 transition-colors hover:text-char/70"
              aria-label="LitRoute on Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://reddit.com/r/litroute"
              target="_blank"
              rel="noopener noreferrer"
              className="text-char/40 transition-colors hover:text-char/70"
              aria-label="LitRoute on Reddit"
            >
              <RedditIcon />
            </a>
            {commitUrl && (
              <a
                href={commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-char/40 transition-colors hover:text-char/70"
                aria-label="View current commit on GitHub"
              >
                <GitHubIcon />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
