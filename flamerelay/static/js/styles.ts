// Shared Tailwind class strings for form elements.
// Used across auth pages (Login, Signup, Password*, EmailConfirm, EmailManage).

export const inputClass =
  'w-full rounded-lg border border-char/20 px-3 py-2.5 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20';

export const labelClass = 'mb-1 block text-sm font-medium text-char/70';

export const primaryBtn =
  'w-full rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50';

// Compact action button used in email/social management rows.
export const secondaryBtn =
  'rounded px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40';
