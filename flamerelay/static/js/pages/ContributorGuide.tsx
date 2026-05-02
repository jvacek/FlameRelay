import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import QA, { LIGHTER_FAQ } from '../components/QA';

const STEPS: {
  n: string;
  q: string;
  a: React.ReactNode;
  tip?: React.ReactNode;
}[] = [
  {
    n: '1',
    q: 'Create the unit',
    a: (
      <p>
        In the admin panel, go to <strong>Backend &rsaquo; Units</strong> and
        click <strong>Add unit</strong>. Use a first name and a number as the
        identifier (e.g. <code>john-93</code>, <code>leila-23</code>). At least
        three characters before the dash, at least two digits after. The
        identifier becomes part of the URL, so keep it short and readable.
      </p>
    ),
    tip: (
      <>
        Pick names with one obvious spelling &mdash; avoid ambiguous ones like
        Steven vs. Stephen or Jeffrey vs. Jeffery. If someone has to guess to
        find the URL, you&rsquo;ve already lost them.
      </>
    ),
  },
  {
    n: '2',
    q: 'Make the label',
    a: (
      <p>
        Write the unit&rsquo;s name in <strong>all caps</strong> and the main
        domain on the label &mdash; e.g. <strong>JOHN-93</strong> and{' '}
        <strong>LITROUTE.COM</strong>. A QR code pointing to the unit URL makes
        it even easier for recipients to check in without having to type
        anything.
      </p>
    ),
    tip: (
      <>
        Also add a short nudge so people know what to do:{' '}
        <em>&ldquo;Scan me, tag me, pass me on&rdquo;</em> or{' '}
        <em>&ldquo;Check in. Keep me moving.&rdquo;</em>
      </>
    ),
  },
  {
    n: '3',
    q: 'Attach the label',
    a: (
      <p>
        Stick the label to the lighter in a way that will last &mdash; clear
        packing tape over the top works well. The label needs to survive being
        pocketed and passed around, so make sure the edges are properly sealed.
        Orient the text so it runs along the <strong>length</strong> of the
        lighter, not across it &mdash; that way someone can read the whole line
        without having to rotate it halfway through.
      </p>
    ),
    tip: (
      <>
        Consider doodling or drawing on the lighter too. A lighter with a face
        or a little character is harder to throw away &mdash; give it a
        personality and people will want to keep it going.
      </>
    ),
  },
  {
    n: '4',
    q: 'Make the first check-in',
    a: (
      <p>
        Visit your unit&rsquo;s page and make the first check-in yourself. This
        seeds the journey and gives the next person something to see when they
        scan the code. You were automatically subscribed when you created the
        unit, so you&rsquo;ll get an email every time someone checks in.
      </p>
    ),
  },
  {
    n: '5',
    q: 'Hand it off',
    a: (
      <p>
        Give the lighter to someone and let it travel. You don&rsquo;t need to
        do anything else &mdash; just watch the notifications come in.
      </p>
    ),
  },
];

export default function ContributorGuide() {
  const { adminUrl } = useAuth();

  return (
    <main>
      <div className="bg-char px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <header>
            <p className="font-heading mb-4 text-4xl font-bold leading-tight text-amber sm:text-5xl">
              Adding &amp; distributing lighters
            </p>
            <p className="text-base leading-relaxed text-parchment/70">
              A practical guide for contributors: how to register a new unit,
              label the lighter, and send it on its way.
            </p>
            {adminUrl && (
              <a
                href={adminUrl}
                className="mt-6 inline-block rounded-btn bg-amber px-5 py-2.5 text-sm font-medium tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0"
              >
                Open admin panel
              </a>
            )}
          </header>
        </div>
      </div>

      <div className="px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="font-heading mb-3 text-xl font-semibold text-char">
            Hey &mdash; thank you for being here.
          </p>
          <p className="mb-4 text-sm leading-relaxed text-char/70">
            Honestly, LitRoute only works because people like you are willing to
            buy lighters, label them, and trust strangers to keep them moving.
            That&rsquo;s the whole thing. Without that, it&rsquo;s just a
            website.
          </p>
          <p className="text-sm leading-relaxed text-char/70">
            I started this because I wanted to see how far a lighter could
            travel, and every time I get a notification from one of them I still
            find it kind of magical. I hope you do too. If you ever have
            feedback, ideas, or just want to share how one of your lighters is
            doing &mdash; please reach out. It genuinely means a lot.
          </p>
        </div>
      </div>

      <div className="px-6 pb-14">
        <div className="mx-auto max-w-2xl">
          <section>
            <h2 className="font-heading mb-8 text-2xl font-bold text-char">
              Step by step
            </h2>
            <div className="space-y-4">
              {STEPS.map(({ n, q, a, tip }) => (
                <div
                  key={n}
                  className="flex gap-5 rounded-xl bg-white px-6 py-5 shadow-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber text-sm font-bold text-white">
                    {n}
                  </div>
                  <div className="pt-0.5 w-full">
                    <QA q={q} a={a} />
                    {tip && (
                      <p className="mt-3 rounded-lg bg-amber/10 px-4 py-3 text-sm leading-relaxed text-char/70 [&_em]:not-italic [&_em]:font-medium [&_strong]:text-char">
                        <span className="mr-1.5 text-amber">✦</span>
                        {tip}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="bg-char px-6 py-14">
        <div className="mx-auto max-w-2xl">
          <section>
            <h2 className="font-heading mb-2 text-2xl font-bold text-parchment">
              Passing it on
            </h2>
            <p className="mb-8 text-sm text-parchment/60">
              The same questions recipients will have &mdash; useful to know
              before you hand the lighter over.
            </p>
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
          <p className="text-sm text-char/60">
            Something unclear or missing?{' '}
            <Link
              to="/about/"
              className="text-amber underline-offset-2 hover:underline"
            >
              Visit the about page
            </Link>{' '}
            or get in touch.
          </p>
        </div>
      </div>
    </main>
  );
}
