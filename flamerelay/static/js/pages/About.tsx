const FAQ = [
  {
    q: 'Who should I give the lighter to?',
    a: (
      <>
        <p>
          Anyone you want. It&rsquo;s your lighter, <strong>you decide</strong>.
          I recommend giving it to someone who you think will enjoy silliness,
          and{' '}
          <strong>who can help the lighter travel as far as possible</strong>;
          someone who you think will come across more people with a similar
          spirit. Maybe someone who&rsquo;s been having a rough time lately?
        </p>
        <p className="mt-2">
          Otherwise, maybe you can also{' '}
          <strong>try leaving it in a busy place</strong> like at a bar, a club
          smoking room, airport lounges, or any other place you think
          like-minded people might end up in. It&rsquo;s a bit of a risk though,
          because it might get thrown away by someone who doesn&rsquo;t know
          what it is, or they won&rsquo;t be curious enough to check the site.
        </p>
      </>
    ),
  },
  {
    q: 'Should I make more than one check-in?',
    a: (
      <>
        <p>
          Make as many check-ins as you want, but I definitely recommend making{' '}
          <strong>at least one when you get the lighter</strong>. You can also
          keep{' '}
          <strong>making ones whenever you go to a significant place</strong>,
          like a different town, country, or a place you think is cool like a
          festival or the beach.
        </p>
        <p className="mt-2">
          The idea is that you see the lighter travel from hand to hand and from
          place to place. As a rule of thumb, check-in when you would
          expect/want other people to check-in.
        </p>
      </>
    ),
  },
  {
    q: 'Anything I should do with the lighter?',
    a: (
      <>
        <p>
          If you can, please <strong>top up the lighter</strong> before passing
          it on. That way it will travel that little bit further.
        </p>
        <p className="mt-2">
          You can also doodle on it, or decorate it in any way you want.
        </p>
      </>
    ),
  },
  {
    q: 'What do I do if the lighter died?',
    a: (
      <p>
        If you can, please refill it. If you can&rsquo;t, please pass it on to
        someone else.
      </p>
    ),
  },
  {
    q: 'Why can I not see all the lighters?',
    a: (
      <>
        <p>
          It&rsquo;s an arbitrary choice I made, but I feel like I&rsquo;d like
          to <strong>keep the experience special and personal</strong> to those
          who have actually had the lighters in their hands. Hopefully this will
          also encourage you to be more personal with your check-ins as you
          won&rsquo;t worry about the whole world seeing your messages.
        </p>
        <p className="mt-2">
          Want to write a little love-letter to your crush which they get to
          read when they check the lighter&rsquo;s history? Go ahead, no one
          will see it but them (and the people who they will pass the lighter
          to, so watch out lmao).
        </p>
      </>
    ),
  },
];

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

function QA({
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
              {FAQ.map(({ q, a }) => (
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
