import { useTranslation } from 'react-i18next';

import KofiIcon from '../assets/logos/kofi_symbol.svg?react';
import LiberapayIcon from '../assets/logos/liberapay_logo_black.svg?react';
import GitHubIcon from '../assets/logos/GitHub_Invertocat_Black.svg?react';

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
      </div>
    </div>
  );
}
