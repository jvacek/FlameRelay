import KofiIcon from '../assets/logos/kofi_symbol.svg?react';
import LiberapayIcon from '../assets/logos/liberapay_logo_black.svg?react';
import GitHubIcon from '../assets/logos/GitHub_Invertocat_Black.svg?react';

const PLATFORMS = [
  {
    href: 'https://ko-fi.com/jvacek',
    label: 'Ko-fi',
    description: 'One-time tip, no account needed',
    Icon: KofiIcon,
  },
  {
    href: 'https://liberapay.com/jvacek/donate',
    label: 'Liberapay',
    description: 'Recurring weekly or monthly',
    Icon: LiberapayIcon,
  },
  {
    href: 'https://github.com/sponsors/jvacek',
    label: 'GitHub Sponsors',
    description: 'Sponsor directly on GitHub',
    Icon: GitHubIcon,
  },
];

export default function Support() {
  return (
    <main>
      <div className="px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <header>
            <p className="font-heading mb-4 text-4xl font-bold leading-tight text-amber sm:text-5xl">
              Support this project.
            </p>
            <p className="text-base leading-relaxed text-char/70">
              LitRoute is free and independent. Here&apos;s what keeps it
              running.
            </p>
          </header>
        </div>
      </div>

      <div className="bg-char px-6 py-14">
        <div className="mx-auto max-w-2xl space-y-10">
          <div className="space-y-4 text-smoke">
            <p className="text-base leading-relaxed">
              LitRoute is a one-person project. There are no ads, no
              subscriptions, and no investors &mdash; just server costs, email
              delivery, and storage coming out of my own pocket. That includes
              the lighters themselves: each one is bought and registered by hand
              before it can start its journey.
            </p>
            <p className="text-base leading-relaxed">
              If you&apos;ve enjoyed following a journey here, a small
              contribution goes a long way.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {PLATFORMS.map(({ href, label, description, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-4 rounded-card border border-parchment/10 bg-parchment/5 p-5 transition-colors hover:border-amber/40 hover:bg-parchment/10"
              >
                <span className="text-amber">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-parchment">
                    {label}
                  </span>
                  <span className="text-xs text-smoke">{description}</span>
                </span>
                <span className="mt-auto text-xs font-medium text-amber/70 transition-colors group-hover:text-amber">
                  Donate →
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
