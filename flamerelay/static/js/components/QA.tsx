export const LIGHTER_FAQ = [
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
