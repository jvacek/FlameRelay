import QA, { LIGHTER_FAQ } from '../components/QA';

const ABOUT = [
  {
    q: 'Why?',
    a: (
      <p>
        Because I wanted to. I&rsquo;m funemployed, and I thought: what if a
        lighter could tell you where it had been?
      </p>
    ),
  },
  {
    q: 'How?',
    a: (
      <p>
        Built with Django and React. Open source &mdash;{' '}
        <a
          href="https://github.com/jvacek/flamerelay"
          className="text-amber underline-offset-2 hover:underline"
        >
          GitHub repo
        </a>
        . PRs welcome after opening an issue.
      </p>
    ),
  },
  {
    q: 'Who?',
    a: (
      <p>
        My name is Jonas. You can{' '}
        <a
          href={`mailto:${atob('Y29udGFjdEBsaXRyb3V0ZS5jb20=')}`}
          className="text-amber underline-offset-2 hover:underline"
        >
          send me an email
        </a>{' '}
        or reach me via{' '}
        <a
          href="https://fosstodon.org/@jvacek"
          className="text-amber underline-offset-2 hover:underline"
        >
          @jvacek@fosstodon.org
        </a>
      </p>
    ),
  },
  {
    q: 'Where can I follow along?',
    a: (
      <p>
        On{' '}
        <a
          href="https://instagram.com/lit_route"
          className="text-amber underline-offset-2 hover:underline"
        >
          Instagram (@lit_route)
        </a>{' '}
        and on{' '}
        <a
          href="https://reddit.com/r/litroute"
          className="text-amber underline-offset-2 hover:underline"
        >
          Reddit (r/litroute)
        </a>
        .
      </p>
    ),
  },
  {
    q: 'Can I give you money?',
    a: (
      <p>
        Sure, these lighters don&rsquo;t grow on trees.{' '}
        <a
          href="https://github.com/sponsors/jvacek"
          className="text-amber underline-offset-2 hover:underline"
        >
          Here&rsquo;s a link
        </a>
      </p>
    ),
  },
  {
    q: 'Is it secure?',
    a: (
      <>
        <p>
          Storing as little as possible is a design goal, not an afterthought.
          We don&rsquo;t store passwords at all &mdash; login is via a magic
          code sent to your email, so there&rsquo;s nothing to leak. The EXIF
          data on images is stripped, and your location is whatever you type in
          manually.
        </p>
        <p className="mt-2">
          Don&rsquo;t believe me? The code is open for everyone to see. You can
          even run your own LitRoute, just please call it something else.
        </p>
      </>
    ),
  },
  {
    q: 'Will you try to make money off of this?',
    a: (
      <>
        <p>
          Honestly, I don&rsquo;t know. I&rsquo;m not planning on it. I&rsquo;d
          much rather keep funding this from my own pocket and donations.
        </p>
        <p className="mt-2">
          This is my little personal project that I want to work on purely for
          fun, and when you start making money off of something it can quickly
          become a source of stress, so I&rsquo;d rather avoid that.
        </p>
        <p className="mt-2">
          Either way, your personal identifiable information will never be sold
          or given to anyone.
        </p>
      </>
    ),
  },
  {
    q: 'Is there any way I can help?',
    a: (
      <>
        <p>
          Sure! Even if you don&rsquo;t code, I&rsquo;m looking for people who
          would be happy to buy their own lighters and register them into the
          system. I&rsquo;m not at the stage where I can make this self-service,
          so just reach out to me using the contact info above.
        </p>
        <p className="mt-2">
          If you do code, I&rsquo;m happy to accept pull requests, just make
          sure to open an issue first so we can discuss it!
        </p>
        <p className="mt-2">
          And if you just feel like donating, feel free to do that using my{' '}
          <a
            href="https://github.com/sponsors/jvacek"
            className="text-amber underline-offset-2 hover:underline"
          >
            GitHub Sponsor page
          </a>
        </p>
      </>
    ),
  },
];

export default function About() {
  return (
    <main>
      <div className="px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <header>
            <p className="font-heading mb-4 text-4xl font-bold leading-tight text-amber sm:text-5xl">
              For people who leave things behind on purpose.
            </p>
            <p className="text-base leading-relaxed text-char/70">
              A lighter travels from hand to hand. Each owner checks in &mdash;
              a photo, a location, a message. This is where you follow the
              journey.
            </p>
          </header>
        </div>
      </div>

      <div className="bg-char px-6 py-14">
        <div className="mx-auto max-w-2xl">
          <section>
            <h2 className="font-heading mb-8 text-2xl font-bold text-parchment">
              FAQ
            </h2>
            <div className="space-y-8">
              {LIGHTER_FAQ.map(({ q, a }) => (
                <QA key={q} q={q} a={a} dark />
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="px-6 py-14">
        <div className="mx-auto max-w-2xl">
          <section>
            <h2 className="font-heading mb-8 text-2xl font-bold text-char">
              About the project
            </h2>
            <div className="space-y-8">
              {ABOUT.map(({ q, a }) => (
                <QA key={q} q={q} a={a} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
