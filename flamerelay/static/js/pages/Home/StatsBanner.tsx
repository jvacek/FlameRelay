import { GlobePin, SpinningGlobe } from './SpinningGlobe';

export interface Stats {
  active_unit_count: number;
  checkin_count: number;
  contributing_user_count: number;
  total_distance_traveled_km: number;
}

export function StatsBanner({
  stats,
  pins,
}: {
  stats: Stats | null;
  pins: GlobePin[];
}) {
  function fmt(n: number | null | undefined): string {
    if (n == null) return '—';
    if (n >= 1000) return n.toLocaleString();
    return String(n);
  }

  const items = [
    { value: fmt(stats?.active_unit_count), label: 'active lighters' },
    { value: fmt(stats?.checkin_count), label: 'check-ins logged' },
    {
      value: fmt(stats?.contributing_user_count),
      label: 'people who checked in',
    },
    {
      value: stats?.total_distance_traveled_km
        ? `${Math.round(stats.total_distance_traveled_km).toLocaleString()} km`
        : '—',
      label: 'traveled so far',
    },
  ];

  return (
    <section className="bg-char px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-12">
          {/* Globe */}
          <SpinningGlobe pins={pins} />

          {/* Stats */}
          <dl className="grid w-full grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {items.map(({ value, label }) => (
              <div key={label} className="text-center">
                <dt className="font-heading text-4xl font-bold text-amber sm:text-5xl">
                  {value}
                </dt>
                <dd className="mt-2 text-sm text-smoke">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
