import { Link } from 'react-router-dom';

interface ErrorPageProps {
  code: number;
  exception?: string;
  csrf?: boolean;
}

interface ErrorConfig {
  headline: string;
  description: string;
  color: 'amber' | 'ember';
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 36"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 0C12 0 4 10 4 20C4 28 7.5 34 12 36C16.5 34 20 28 20 20C20 10 12 0 12 0ZM12 30C9.8 27.5 8.5 24.5 8.5 21C8.5 17.5 10.5 14.5 12 12.5C13.5 14.5 15.5 17.5 15.5 21C15.5 24.5 14.2 27.5 12 30Z" />
    </svg>
  );
}

function getConfig(code: number, csrf: boolean): ErrorConfig {
  if (code === 404) {
    return {
      headline: 'The trail ends here',
      description:
        "This page doesn't exist or may have moved. The lighter you're looking for is off the map.",
      color: 'amber',
    };
  }
  if (code === 403 && csrf) {
    return {
      headline: 'Session expired',
      description: 'Your form session timed out. Go back and try again.',
      color: 'ember',
    };
  }
  if (code === 403) {
    return {
      headline: "You're not allowed here",
      description: "You don't have permission to access this page.",
      color: 'ember',
    };
  }
  return {
    headline: 'Something went wrong',
    description:
      'We track these errors automatically. Try refreshing — if the problem persists, come back later.',
    color: 'ember',
  };
}

export default function ErrorPage({
  code,
  exception,
  csrf = false,
}: ErrorPageProps) {
  const config = getConfig(code, csrf);
  const iconColor = config.color === 'amber' ? 'text-amber' : 'text-ember';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <FlameIcon className={`mb-4 h-12 w-12 ${iconColor}`} />
      <p className="select-none font-heading text-[8rem] font-bold leading-none text-char/10">
        {code}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold text-char">
        {config.headline}
      </h1>
      <p className="mt-3 max-w-sm text-smoke">
        {exception || config.description}
      </p>
      <Link
        to="/"
        className="mt-8 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-char transition-colors hover:bg-amber/80"
      >
        Back to Home
      </Link>
    </div>
  );
}
