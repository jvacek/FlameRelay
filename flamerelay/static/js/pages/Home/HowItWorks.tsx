const STEPS = [
  {
    n: '1',
    title: 'Find it.',
    body: "Spot a lighter with a QR sticker. Scan it, or type its ID on litroute.com. Every city, every hand it passed through — it's all there waiting for you.",
  },
  {
    n: '2',
    title: 'Check in.',
    body: "Drop a photo and a quick note. Your moment — where you were, what you saw — becomes a permanent chapter in the lighter's story.",
  },
  {
    n: '3',
    title: 'Pass it on.',
    body: 'Hand it to a stranger. Leave it at a coffee shop, a hostel, a trailhead. You decide the next chapter.',
  },
  {
    n: '4',
    title: 'Follow along.',
    body: 'Subscribe and get an email the next time someone finds it — wherever in the world that turns out to be. Low-stakes stalking of a piece of metal.',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-linen px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading mb-14 text-center text-3xl font-bold text-char sm:text-4xl">
          Here&rsquo;s the deal.
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
