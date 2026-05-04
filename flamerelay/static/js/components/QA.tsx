import { Trans, useTranslation } from 'react-i18next';

export function useLighterFaq() {
  const { t } = useTranslation();
  return [
    {
      q: t('faq.lighter.giveToWhom.q'),
      a: (
        <>
          <p>
            <Trans
              i18nKey="faq.lighter.giveToWhom.a1"
              components={{ b: <strong /> }}
            />
          </p>
          <p className="mt-2">
            <Trans
              i18nKey="faq.lighter.giveToWhom.a2"
              components={{ b: <strong /> }}
            />
          </p>
        </>
      ),
    },
    {
      q: t('faq.lighter.multipleCheckins.q'),
      a: (
        <>
          <p>
            <Trans
              i18nKey="faq.lighter.multipleCheckins.a1"
              components={{ b: <strong /> }}
            />
          </p>
          <p className="mt-2">{t('faq.lighter.multipleCheckins.a2')}</p>
        </>
      ),
    },
    {
      q: t('faq.lighter.anythingDo.q'),
      a: (
        <>
          <p>
            <Trans
              i18nKey="faq.lighter.anythingDo.a1"
              components={{ b: <strong /> }}
            />
          </p>
          <p className="mt-2">{t('faq.lighter.anythingDo.a2')}</p>
        </>
      ),
    },
    {
      q: t('faq.lighter.lightDied.q'),
      a: <p>{t('faq.lighter.lightDied.a')}</p>,
    },
    {
      q: t('faq.lighter.cantSeeAll.q'),
      a: (
        <>
          <p>
            <Trans
              i18nKey="faq.lighter.cantSeeAll.a1"
              components={{ b: <strong /> }}
            />
          </p>
          <p className="mt-2">{t('faq.lighter.cantSeeAll.a2')}</p>
        </>
      ),
    },
  ];
}

export default function QA({
  q,
  a,
  dark = false,
}: {
  q: string;
  a: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div>
      <h3
        className={`font-heading mb-2 text-lg font-semibold ${dark ? 'text-amber' : 'text-char'}`}
      >
        {q}
      </h3>
      <div
        className={`text-sm leading-relaxed ${dark ? 'text-parchment/60 [&_strong]:text-parchment' : 'text-char/70'}`}
      >
        {a}
      </div>
    </div>
  );
}
