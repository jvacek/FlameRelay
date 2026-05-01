import { Link } from 'react-router-dom';

export function Cta() {
  return (
    <section className="parchment-glow px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading mb-4 text-3xl font-bold text-char sm:text-4xl">
          Start a journey.
        </h2>
        <p className="mb-8 text-base leading-relaxed text-smoke">
          I&rsquo;m Jonas, I made this while funemployed. Want to send a lighter
          into the world?{' '}
          <Link
            to="/about/"
            className="font-medium text-amber underline-offset-2 hover:underline"
          >
            Read the about page
          </Link>{' '}
          first &mdash; you&rsquo;ll need to get in touch before you start
          printing labels.
        </p>
        <Link
          to="/about/"
          className="text-sm font-semibold tracking-wide text-amber underline-offset-4 transition-colors hover:underline"
        >
          About the project →
        </Link>
      </div>
    </section>
  );
}
