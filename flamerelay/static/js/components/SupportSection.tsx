import { useTranslation } from 'react-i18next';

import KofiIcon from '../assets/logos/kofi_symbol.svg?react';
import LiberapayIcon from '../assets/logos/liberapay_logo_black.svg?react';
import GitHubIcon from '../assets/logos/GitHub_Invertocat_Black.svg?react';

// TODO: update with your actual Weblate project URL
const WEBLATE_URL = 'https://hosted.weblate.org/projects/litroute/';

interface Props {
  heading?: string;
}

export default function SupportSection({ heading }: Props) {
  const { t } = useTranslation();

  const PLATFORMS = [
    {
      href: 'https://ko-fi.com/jvacek',
      label: t('supportSection.kofiLabel'),
      description: t('supportSection.kofiDescription'),
      Icon: KofiIcon,
    },
    {
      href: 'https://liberapay.com/jvacek/donate',
      label: t('supportSection.liberapayLabel'),
      description: t('supportSection.liberapayDescription'),
      Icon: LiberapayIcon,
    },
    {
      href: 'https://github.com/sponsors/jvacek',
      label: t('supportSection.githubLabel'),
      description: t('supportSection.githubDescription'),
      Icon: GitHubIcon,
    },
  ];

  return (
    <div className="bg-char px-6 py-14">
      <div className="mx-auto max-w-2xl space-y-10">
        <div className="space-y-4 text-smoke">
          {heading && (
            <h2 className="font-heading mb-4 text-2xl font-bold text-parchment">
              {heading}
            </h2>
          )}
          <p className="text-base leading-relaxed">
            {t('supportSection.body1')}
          </p>
          <p className="text-base leading-relaxed">
            {t('supportSection.body2')}
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
                {t('supportSection.donateCta')} &rarr;
              </span>
            </a>
          ))}
        </div>

        <div className="border-t border-parchment/10 pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-parchment/40">
            {t('supportSection.otherWaysHeading')}
          </p>
          <a
            href={WEBLATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-card border border-parchment/10 bg-parchment/5 px-5 py-3 transition-colors hover:border-amber/40 hover:bg-parchment/10"
          >
            <svg
              className="h-5 w-5 text-amber"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-parchment">
                {t('supportSection.weblateLabel')}
              </span>
              <span className="text-xs text-smoke">
                {t('supportSection.weblateDescription')}
              </span>
            </span>
            <span className="ml-auto text-xs font-medium text-amber/70 transition-colors group-hover:text-amber">
              {t('supportSection.weblateCta')} &rarr;
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
