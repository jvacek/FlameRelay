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
    a: <p>Because I wanted to. I&rsquo;m funemployed.</p>,
  },
  {
    q: 'How?',
    a: (
      <p>
        <a
          href="https://github.com/jvacek/flamerelay"
          className="text-amber underline-offset-2 hover:underline"
        >
          GitHub repo
        </a>
      </p>
    ),
  },
  {
    q: 'Who?',
    a: (
      <p>
        My name is Jonas. You can{' '}
        <a
          href={`mailto:${atob('anZhY2VrQHBtLm1l')}`}
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
          At no point should anyone be able to get anything identifiable from
          the site. I use accounts to prevent abuse, but other than that I avoid
          storing any personal information. The EXIF info on the images should
          be washed out, and the location is manually input by you.
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

function Card({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-char/10 bg-white p-5 shadow-sm">
      <h3 className="font-heading mb-3 text-lg font-semibold text-char">{q}</h3>
      <div className="text-sm leading-relaxed text-char/80">{a}</div>
    </div>
  );
}

export default function About() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* FAQ */}
        <section>
          <h1 className="font-heading mb-6 text-3xl font-bold text-char">
            FAQ
          </h1>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <Card key={q} q={q} a={a} />
            ))}
          </div>
        </section>

        {/* About */}
        <section>
          <h1 className="font-heading mb-6 text-3xl font-bold text-char">
            About the project
          </h1>
          <div className="space-y-4">
            {ABOUT.map(({ q, a }) => (
              <Card key={q} q={q} a={a} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
