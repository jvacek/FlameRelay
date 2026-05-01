import { useEffect, useState } from 'react';

import lighterSrc from '../assets/YellowLighter.svg';

const PLACEHOLDER_NAMES = [
  'adam-01',
  'sara-7',
  'mike-22',
  'rosa-44',
  'john-93',
  'ember-3',
];
const TYPE_MS = 80;
const DELETE_MS = 40;
const HOLD_MS = 2000;

// The SVG is portrait (138×411). Rotated 90° CW it becomes landscape (411×138).
// Yellow body occupies y≈73–399 in the original → x≈3%–82% in the rotated view.
// The sparker mechanism sits at the right end (x≈82–100%).

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
    // Outer div maintains the 411:138 aspect ratio via padding-bottom trick
    <div
      className="relative w-full"
      style={{ paddingBottom: `${(138 / 411) * 100}%` }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[8px]">
        {/* Portrait SVG sized so that after rotate(90deg) it fills the landscape container:
            img element width  = container height (≈33.6% of container width)
            img element height = container width  (100% of container width)
            rotate(90deg) swaps visual W/H → fits perfectly */}
        <img
          src={lighterSrc}
          alt="A lighter lying on its side"
          className="pointer-events-none absolute"
          style={{
            width: `${(138 / 411) * 100}%`,
            height: `${(411 / 138) * 100}%`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(90deg)',
          }}
        />

        {/* Overlay positioned on the yellow body area */}
        <div
          className="absolute flex flex-col items-center justify-center gap-3"
          style={{
            left: '5%',
            right: '22%',
            top: '10%',
            bottom: '10%',
          }}
        >
          <label
            htmlFor="lighter-id"
            className="font-handwriting text-5xl text-char/60"
            style={{ transform: 'rotate(-1deg)' }}
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
            className="w-44 rounded bg-white/75 px-3 py-0.5 text-2xl text-char placeholder-char/25 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
          />
        </div>
      </div>
    </div>
  );
}
