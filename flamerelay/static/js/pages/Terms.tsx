import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t } = useTranslation();
  return (
    <main>
      <div className="px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <header>
            <h1 className="font-heading mb-4 text-4xl font-bold text-char sm:text-5xl">
              {t('terms.title')}
            </h1>
            <p className="text-base leading-relaxed text-char/70">
              {t('terms.body')}
            </p>
          </header>
        </div>
      </div>
    </main>
  );
}
