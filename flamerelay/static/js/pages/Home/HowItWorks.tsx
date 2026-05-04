import { useTranslation } from 'react-i18next';

export function HowItWorks() {
  const { t } = useTranslation();

  const STEPS = [
    {
      n: '1',
      title: t('home.howItWorks.step1Title'),
      body: t('home.howItWorks.step1Body'),
    },
    {
      n: '2',
      title: t('home.howItWorks.step2Title'),
      body: t('home.howItWorks.step2Body'),
    },
    {
      n: '3',
      title: t('home.howItWorks.step3Title'),
      body: t('home.howItWorks.step3Body'),
    },
    {
      n: '4',
      title: t('home.howItWorks.step4Title'),
      body: t('home.howItWorks.step4Body'),
    },
  ];

  return (
    <section className="bg-linen px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading mb-14 text-center text-3xl font-bold text-char sm:text-4xl">
          {t('home.howItWorks.heading')}
        </h2>
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, title, body }) => (
            <li key={n}>
              <div className="mb-2 grid grid-cols-[auto_1fr] items-center gap-x-3">
                <span className="font-heading text-6xl leading-none font-bold text-amber/25">
                  {n}
                </span>
                <h3 className="font-heading text-xl font-semibold text-char">
                  {title}
                </h3>
              </div>
              <p className="text-justify text-sm leading-relaxed text-char/70">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
