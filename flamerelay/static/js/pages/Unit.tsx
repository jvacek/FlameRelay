import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function comfortZoom(
  pos: [number, number],
  checkins: CheckInData[],
  id: number,
): number {
  const idx = checkins.findIndex((c) => c.id === id);
  const neighbors: [number, number][] = [];
  if (idx > 0) neighbors.push(parseLatLng(checkins[idx - 1].location));
  if (idx < checkins.length - 1)
    neighbors.push(parseLatLng(checkins[idx + 1].location));
  if (neighbors.length === 0) return 9;
  const maxDist = Math.max(...neighbors.map((n) => haversineKm(pos, n)));
  if (maxDist > 3000) return 4;
  if (maxDist > 1000) return 5;
  if (maxDist > 400) return 6;
  if (maxDist > 150) return 7;
  if (maxDist > 60) return 8;
  if (maxDist > 20) return 9;
  return 10;
}

function heroStatus(checkin: CheckInData): string {
  const days = Math.floor(
    (Date.now() - new Date(checkin.date_created).getTime()) / 86400000,
  );
  const place = checkin.place || 'an unknown location';
  if (days === 0) return `Currently in ${place}`;
  if (days === 1) return `Last seen yesterday in ${place}`;
  return `Last seen ${days} days ago in ${place}`;
}

function MapFitter({ points }: { points: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || points.length === 0) return;
    fitted.current = true;
    if (points.length === 1) {
      map.setView(points[0], 10);
    } else {
      map.fitBounds(points, { padding: [30, 30] });
    }
  }, [map, points]);
  return null;
}

function MapResetter({
  resetKey,
  points,
}: {
  resetKey: number;
  points: [number, number][];
}) {
  const map = useMap();
  const prevKey = useRef(resetKey);
  useEffect(() => {
    if (resetKey === prevKey.current) return;
    prevKey.current = resetKey;
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 10, { animate: true });
    } else {
      map.fitBounds(points, { padding: [30, 30] });
    }
  }, [map, resetKey, points]);
  return null;
}

function MapPanner({
  panToRef,
}: {
  panToRef: React.MutableRefObject<
    ((pos: [number, number], zoom: number) => void) | null
  >;
}) {
  const map = useMap();
  useEffect(() => {
    panToRef.current = (pos, zoom) =>
      map.flyTo(pos, zoom, { animate: true, duration: 1.2 });
    return () => {
      panToRef.current = null;
    };
  }, [map, panToRef]);
  return null;
}

interface UnitMapProps {
  checkins: CheckInData[];
  resetKey: number;
  onMarkerClick: (checkin: CheckInData) => void;
  panToRef: React.MutableRefObject<
    ((pos: [number, number], zoom: number) => void) | null
  >;
}

function UnitMap({
  checkins,
  resetKey,
  onMarkerClick,
  panToRef,
}: UnitMapProps) {
  const ordered = useMemo(() => [...checkins].reverse(), [checkins]);
  const points = useMemo(
    () => ordered.map((c) => parseLatLng(c.location)),
    [ordered],
  );
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (points.length === 0) return;
    setVisibleCount(0);
    let count = 0;
    const delay = Math.max(80, Math.min(250, 1500 / points.length));
    const interval = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= points.length) clearInterval(interval);
    }, delay);
    return () => clearInterval(interval);
  }, [points.length]);

  const animatedPoints = points.slice(0, visibleCount);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        referrerPolicy="origin"
      />
      {animatedPoints.length > 1 && (
        <Polyline
          positions={animatedPoints}
          color="#7b8fa1"
          weight={2}
          opacity={0.7}
        />
      )}
      {ordered.map((checkin, i) => {
        if (i >= visibleCount) return null;
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
            eventHandlers={{ click: () => onMarkerClick(checkin) }}
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
      <MapResetter resetKey={resetKey} points={points} />
      <MapPanner panToRef={panToRef} />
    </MapContainer>
  );
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
  const [mapResetKey, setMapResetKey] = useState(0);
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const [focusedCheckinId, setFocusedCheckinId] = useState<number | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const timelineRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const wasScrolledRef = useRef(false);
  const mapPanToRef = useRef<
    ((pos: [number, number], zoom: number) => void) | null
  >(null);
  const panTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkinsRef = useRef(checkins);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    checkinsRef.current = checkins;
  }, [checkins]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idStr = entry.target.getAttribute('data-id');
            if (idStr) {
              const id = parseInt(idStr, 10);
              setVisibleIds((prev) => {
                const next = new Set(prev);
                next.add(id);
                return next;
              });
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' },
    );
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 100) {
        wasScrolledRef.current = true;
      } else if (wasScrolledRef.current && window.scrollY < 50) {
        wasScrolledRef.current = false;
        setMapResetKey((k) => k + 1);
        setFocusedCheckinId(null);
        return;
      }

      // Debounced flyTo: find the timeline card closest to viewport centre
      if (window.scrollY < 100) return;
      if (panTimeoutRef.current) clearTimeout(panTimeoutRef.current);
      panTimeoutRef.current = setTimeout(() => {
        if (!mapPanToRef.current) return;
        // Use the centre of the visible area below the sticky map, not the full viewport centre
        const mapBottom =
          mapWrapperRef.current?.getBoundingClientRect().bottom ?? 0;
        const centre = mapBottom + (window.innerHeight - mapBottom) / 2;
        const atBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 80;
        let closestId: number | null = null;
        let closestPos: [number, number] | null = null;
        let closestDist = Infinity;
        for (const [id, el] of timelineRefs.current) {
          const rect = el.getBoundingClientRect();
          const dist = Math.abs((rect.top + rect.bottom) / 2 - centre);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
            const c = checkinsRef.current.find((x) => x.id === id);
            if (c) closestPos = parseLatLng(c.location);
          }
        }
        // At the very bottom always select the last (oldest) card
        if (atBottom && checkinsRef.current.length > 0) {
          const last = checkinsRef.current[checkinsRef.current.length - 1];
          closestId = last.id;
          closestPos = parseLatLng(last.location);
        }
        if (closestPos && closestId !== null) {
          const zoom = comfortZoom(closestPos, checkinsRef.current, closestId);
          mapPanToRef.current(closestPos, zoom);
        }
        setFocusedCheckinId(closestId);
      }, 80);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (panTimeoutRef.current) clearTimeout(panTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalImageUrl(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  function handleMarkerClick(checkin: CheckInData) {
    const el = timelineRefs.current.get(checkin.id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const currentCheckin = checkins[0] ?? null;
  const heroImageUrl = currentCheckin?.image ?? null;
  const stopsCount = unit.checkin_count;

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-char">
          <div className="flex flex-col sm:flex-row">
            {/* Left: text + stats + CTAs */}
            <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
              <div>
                <h1 className="font-heading mb-1 text-3xl font-bold text-white sm:text-4xl">
                  {identifier}
                </h1>
                {currentCheckin ? (
                  <p className="text-sm font-medium text-amber">
                    {heroStatus(currentCheckin)}
                  </p>
                ) : (
                  <p className="text-sm italic text-white/40">
                    No check-ins yet.
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="my-6 flex gap-6 border-t border-white/10 pt-5">
                {unit.distance_traveled_km > 0 && (
                  <div>
                    <div className="font-heading text-2xl font-bold text-white">
                      {unit.distance_traveled_km.toLocaleString()}
                    </div>
                    <div className="mt-0.5 text-xs uppercase tracking-wide text-white/40">
                      km traveled
                    </div>
                  </div>
                )}
                <div>
                  <div className="font-heading text-2xl font-bold text-white">
                    {stopsCount}
                  </div>
                  <div className="mt-0.5 text-xs uppercase tracking-wide text-white/40">
                    stops
                  </div>
                </div>
                <div>
                  <div className="font-heading text-2xl font-bold text-white">
                    {unit.subscriber_count}
                  </div>
                  <div className="mt-0.5 text-xs uppercase tracking-wide text-white/40">
                    followers
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSubscribe}
                  disabled={subscribeLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 ${
                    unit.is_subscribed
                      ? 'bg-ember text-white hover:opacity-90'
                      : 'bg-amber text-char hover:opacity-90'
                  }`}
                >
                  {unit.is_subscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
                {unit.can_check_in !== false && (
                  <a
                    href={checkinUrl}
                    className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-char hover:bg-white"
                  >
                    New check-in
                  </a>
                )}
                {isAuthenticated && unit.can_check_in === false && (
                  <p className="text-sm italic text-white/40">
                    You&apos;ve passed this lighter on &mdash; its journey
                    continues.
                  </p>
                )}
              </div>
            </div>

            {/* Right: latest check-in photo */}
            {heroImageUrl && (
              <div className="relative hidden sm:block sm:w-56 md:w-72 shrink-0">
                <img
                  src={heroImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Map — sticks below the navbar while scrolling the timeline */}
        {checkins.length > 0 && (
          <div
            ref={mapWrapperRef}
            className="sticky top-0 z-10 mb-8 overflow-hidden rounded-xl border border-char/10 sm:-mx-12"
          >
            <div className="relative h-[280px] sm:h-[450px]">
              <UnitMap
                checkins={checkins}
                resetKey={mapResetKey}
                onMarkerClick={handleMarkerClick}
                panToRef={mapPanToRef}
              />
              <button
                onClick={() => setMapResetKey((k) => k + 1)}
                className="absolute bottom-8 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-char shadow-md backdrop-blur-sm hover:bg-white"
              >
                Reset view
              </button>
            </div>
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
            {checkins.map((c, idx) => {
              const isOwn =
                isAuthenticated && c.created_by_username === currentUsername;
              const editUrl = `/unit/${identifier}/checkin/${c.id}`;
              const isCurrent = idx === 0;
              const isOrigin = idx === checkins.length - 1;
              const isVisible = visibleIds.has(c.id);

              return (
                <li
                  key={c.id}
                  data-id={c.id}
                  ref={(el) => {
                    if (el) {
                      timelineRefs.current.set(c.id, el);
                      if (!visibleIds.has(c.id)) {
                        observerRef.current?.observe(el);
                      }
                    } else {
                      timelineRefs.current.delete(c.id);
                    }
                  }}
                  className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-[border-color,box-shadow] duration-300 ${
                    focusedCheckinId === c.id
                      ? 'border-amber shadow-md shadow-amber/20'
                      : 'border-char/10'
                  }`}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                    transition:
                      'opacity 0.5s ease-out, transform 0.5s ease-out, border-color 0.3s, box-shadow 0.3s',
                  }}
                >
                  {checkins.length > 1 && isOrigin && (
                    <div className="border-b border-amber/20 bg-amber/10 px-4 py-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-amber/80">
                        Origin
                      </span>
                    </div>
                  )}
                  {checkins.length > 1 && isCurrent && (
                    <div className="border-b border-ember/20 bg-ember/10 px-4 py-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-ember">
                        Current location
                      </span>
                    </div>
                  )}

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

                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:gap-4">
                    <div className="min-w-0 flex-1">
                      {c.message && (
                        <p className="mb-2 text-sm text-char/80">{c.message}</p>
                      )}
                      <p className="text-xs text-smoke">
                        by {c.created_by_name}
                      </p>
                    </div>
                    {c.image && (
                      <div className="shrink-0 sm:w-48 md:w-56">
                        <img
                          src={c.image}
                          alt="check-in photo"
                          className="max-h-60 w-full cursor-zoom-in rounded-lg object-contain"
                          onClick={() => setModalImageUrl(c.image)}
                        />
                      </div>
                    )}
                  </div>

                  {isOwn && (
                    <div className="flex gap-2 border-t border-char/5 bg-linen/30 px-4 py-3">
                      {c.within_edit_grace_period ? (
                        <>
                          <a
                            href={editUrl}
                            className="rounded bg-smoke/15 px-3 py-1 text-xs font-medium text-char hover:bg-smoke/25"
                          >
                            Edit
                          </a>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="rounded bg-ember/10 px-3 py-1 text-xs font-medium text-ember hover:bg-ember/20"
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

      {/* Fullscreen image modal */}
      {modalImageUrl && (
        <div
          className="fixed inset-0 z-[2000] flex cursor-pointer items-center justify-center bg-black/90 p-4"
          onClick={() => setModalImageUrl(null)}
        >
          <img
            src={modalImageUrl}
            alt=""
            className="max-h-full max-w-full cursor-default rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg text-white hover:bg-white/30"
            onClick={() => setModalImageUrl(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
