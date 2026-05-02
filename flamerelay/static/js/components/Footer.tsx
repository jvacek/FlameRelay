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
    </footer>
  );
}
