import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { apiFetch } from '../api';

interface CheckInData {
  id: number;
  date_created: string;
  created_by_username: string;
  created_by_name: string;
  image: string | null;
  message: string;
  place: string;
  location: string;
  within_edit_grace_period: boolean;
}

interface UnitData {
  identifier: string;
  checkin_count: number;
  subscriber_count: number;
  distance_traveled_km: number;
  is_subscribed: boolean;
  can_check_in: boolean | null;
}

interface UnitProps {
  identifier: string;
  checkinUrl: string;
  isAuthenticated: boolean;
  currentUsername: string;
  loginUrl: string;
}

function parseLatLng(loc: string): [number, number] {
  const [a, b] = loc.split(',');
  return [parseFloat(a), parseFloat(b)];
}

function MapFitter({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 10);
    } else {
      map.fitBounds(points, { padding: [30, 30] });
    }
  }, [map, points]);
  return null;
}

function UnitMap({ checkins }: { checkins: CheckInData[] }) {
  // API returns newest-first; reverse for chronological map order
  const ordered = [...checkins].reverse();
  const points: [number, number][] = ordered.map((c) =>
    parseLatLng(c.location),
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        referrerPolicy="origin"
      />
      {points.length > 1 && (
        <Polyline positions={points} color="#7b8fa1" weight={2} opacity={0.7} />
      )}
      {ordered.map((checkin, i) => {
        const pos = parseLatLng(checkin.location);
        const isFirst = i === 0;
        const isLast = i === ordered.length - 1;
        const color = isFirst ? '#e8a030' : isLast ? '#c94c35' : '#7b8fa1';
        return (
          <CircleMarker
            key={checkin.id}
            center={pos}
            radius={8}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}
          >
            <Popup>
              <strong>{checkin.place || 'Unknown place'}</strong>
              <br />
              <small>
                {new Date(checkin.date_created).toLocaleDateString()}
              </small>
              {checkin.image && (
                <>
                  <br />
                  <img
                    src={checkin.image}
                    alt=""
                    style={{ maxWidth: 120, marginTop: 4 }}
                  />
                </>
              )}
            </Popup>
          </CircleMarker>
        );
      })}
      <MapFitter points={points} />
    </MapContainer>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Unit({
  identifier,
  checkinUrl,
  isAuthenticated,
  currentUsername,
  loginUrl,
}: UnitProps) {
  const [unit, setUnit] = useState<UnitData | null>(null);
  const [checkins, setCheckins] = useState<CheckInData[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/units/${identifier}/`).then((r) => r.json()),
      fetch(`/api/units/${identifier}/checkins/`).then((r) => r.json()),
    ])
      .then(([unitData, checkinData]: [UnitData, CheckInData[]]) => {
        setUnit(unitData);
        setCheckins(
          Array.isArray(checkinData)
            ? checkinData
            : (checkinData as { results: CheckInData[] }).results,
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [identifier]);

  async function handleSubscribe() {
    if (!isAuthenticated) {
      window.location.href = `${loginUrl}?next=/unit/${identifier}/`;
      return;
    }
    setSubscribeLoading(true);
    try {
      const method = unit?.is_subscribed ? 'DELETE' : 'POST';
      await apiFetch(`/api/units/${identifier}/subscribe/`, { method });
      setUnit((u) => (u ? { ...u, is_subscribed: !u.is_subscribed } : u));
    } catch (e) {
      console.error(e);
    } finally {
      setSubscribeLoading(false);
    }
  }

  async function handleDelete(checkinId: number) {
    if (!confirm('Delete this check-in?')) return;
    await apiFetch(`/api/units/${identifier}/checkins/${checkinId}/`, {
      method: 'DELETE',
    });
    setCheckins((cs) => cs.filter((c) => c.id !== checkinId));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center text-smoke">
        Loading…
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center text-ember">
        Unit not found.
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold text-char">
          {identifier}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          {isAuthenticated && unit.can_check_in === false && (
            <p className="flex-1 text-sm italic text-smoke">
              You&apos;ve passed this lighter on &mdash; its journey continues.
            </p>
          )}
          <button
            onClick={handleSubscribe}
            disabled={subscribeLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 ${
              unit.is_subscribed
                ? 'bg-smoke/10 text-char hover:bg-smoke/20'
                : 'bg-amber text-white hover:opacity-90'
            }`}
          >
            {unit.is_subscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
          {unit.can_check_in !== false && (
            <a
              href={checkinUrl}
              className="rounded-lg bg-char px-4 py-2 text-sm font-medium text-white hover:opacity-80"
            >
              New check-in
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <dl className="mb-8 grid grid-cols-3 gap-4 rounded-xl bg-linen p-4 text-center">
        <div>
          <dt className="text-xs uppercase tracking-wide text-smoke">
            Distance
          </dt>
          <dd className="font-heading text-2xl font-bold text-char">
            {unit.distance_traveled_km} km
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-smoke">
            Check-ins
          </dt>
          <dd className="font-heading text-2xl font-bold text-char">
            {unit.checkin_count}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-smoke">
            Subscribers
          </dt>
          <dd className="font-heading text-2xl font-bold text-char">
            {unit.subscriber_count}
          </dd>
        </div>
      </dl>

      {/* Map */}
      {checkins.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-xl border border-char/10">
          <UnitMap checkins={checkins} />
        </div>
      )}

      {/* Timeline */}
      <h2 className="font-heading mb-6 text-2xl font-bold text-char">
        Travel log
      </h2>
      {checkins.length === 0 ? (
        <p className="text-smoke">No check-ins yet. Be the first!</p>
      ) : (
        <ul className="space-y-6">
          {checkins.map((c) => {
            const isOwn =
              isAuthenticated && c.created_by_username === currentUsername;
            const editUrl = `/unit/${identifier}/checkin/${c.id}`;
            return (
              <li
                key={c.id}
                className="overflow-hidden rounded-xl border border-char/10 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between bg-linen/60 px-4 py-3">
                  <span className="font-medium text-char">
                    {c.place ? (
                      c.place
                    ) : (
                      <em className="text-smoke">Place not given</em>
                    )}
                  </span>
                  <span className="text-xs text-smoke">
                    {fmtDate(c.date_created)}
                  </span>
                </div>
                <div className="p-4">
                  {c.message && (
                    <p className="mb-3 text-sm text-char/80">{c.message}</p>
                  )}
                  {c.image && (
                    <img
                      src={c.image}
                      alt="check-in photo"
                      className="mb-3 max-h-96 w-full rounded-lg object-cover"
                    />
                  )}
                  <p className="text-xs text-smoke">by {c.created_by_name}</p>
                </div>
                {isOwn && (
                  <div className="flex gap-2 border-t border-char/5 bg-linen/30 px-4 py-3">
                    {c.within_edit_grace_period ? (
                      <>
                        <a
                          href={editUrl}
                          className="rounded px-3 py-1 text-xs font-medium bg-smoke/10 text-char hover:bg-smoke/20"
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded px-3 py-1 text-xs font-medium bg-ember/10 text-ember hover:bg-ember/20"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-smoke/60">
                        Cannot edit or delete after 6 hours
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
