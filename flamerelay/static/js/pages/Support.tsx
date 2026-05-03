import SupportSection from '../components/SupportSection';

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

      <SupportSection />
    </main>
  );
}
