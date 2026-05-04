import { useEffect, useState } from 'react';

import lighterSrc from '../../assets/lighter.webp';

const PLACEHOLDER_NAMES = [
  'SARA-07',
  'MIKE-22',
  'ROSA-44',
  'JOHN-93',
  'EMBER-03',
];
const TYPE_MS = 80;
const DELETE_MS = 40;
const HOLD_MS = 2000;

export default function LighterInput({
  inputRef,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_NAMES[0]);

  useEffect(() => {
    if (reducedMotion) return;

    let idx = 0;
    let chars = PLACEHOLDER_NAMES[0].length;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      const name = PLACEHOLDER_NAMES[idx];
      if (deleting) {
        chars--;
        setPlaceholder(name.slice(0, chars));
        if (chars === 0) {
          idx = (idx + 1) % PLACEHOLDER_NAMES.length;
          deleting = false;
          timer = setTimeout(step, TYPE_MS * 4);
        } else {
          timer = setTimeout(step, DELETE_MS);
        }
      } else {
        const next = PLACEHOLDER_NAMES[idx];
        chars++;
        setPlaceholder(next.slice(0, chars));
        if (chars >= next.length) {
          timer = setTimeout(() => {
            deleting = true;
            step();
          }, HOLD_MS);
        } else {
          timer = setTimeout(step, TYPE_MS);
        }
      }
    };

    timer = setTimeout(() => {
      deleting = true;
      step();
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return (
    // @container lets children use cqw units so text scales with the lighter width
    <div
      className="relative w-full @container"
      style={{ paddingBottom: `${(645 / 1827) * 100}%` }}
    >
      <div className="absolute inset-0">
        <img
          src={lighterSrc}
          alt="A lighter lying on its side"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />

        {/* Centered on the orange body: x≈39% (midpoint of 4%–73%), y≈50% */}
        <div
          className="absolute flex flex-col items-center gap-3"
          style={{
            top: '47%',
            left: '42%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <label
            htmlFor="lighter-id"
            className="font-handwriting text-char/60 whitespace-nowrap"
            style={{
              fontSize: '10cqw',
              lineHeight: 1.1,
              transform: 'rotate(-1deg)',
            }}
          >
            hello, my name is
          </label>
          <input
            id="lighter-id"
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="rounded bg-white/75 px-3 py-1 text-char placeholder-char/25 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
            style={{
              width: '40cqw',
              fontSize: 'clamp(0.875rem, 5cqw, 1.5rem)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
