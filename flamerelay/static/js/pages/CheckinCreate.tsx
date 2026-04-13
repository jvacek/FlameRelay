import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { apiFetch } from '../api';

interface CheckinCreateProps {
  identifier: string;
  unitUrl: string;
}

function LocationPicker({ onPick }: { onPick: (loc: string) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPick(`${lat},${lng}`);
    },
  });
  return null;
}

function MapFlyer({ to }: { to: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (to) map.setView(to, 15);
  }, [map, to]);
  return null;
}

export default function CheckinCreate({
  identifier,
  unitUrl,
}: CheckinCreateProps) {
  const [location, setLocation] = useState<string>('');
  const [place, setPlace] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [geolocating, setGeolocating] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [showPrivacyHint, setShowPrivacyHint] = useState(false);

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        const loc: [number, number] = [lat, lng];
        setLocation(`${lat},${lng}`);
        setFlyTarget(loc);
        setShowPrivacyHint(true);
        setGeolocating(false);
      },
      () => {
        setErrors((e) => ({
          ...e,
          location: [
            'Could not get your location. Please allow location access and try again.',
          ],
        }));
        setGeolocating(false);
      },
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location) {
      setErrors({ location: ['Please click the map to set your location.'] });
      return;
    }
    setSubmitting(true);
    setErrors({});

    const data = new FormData();
    data.append('location', location);
    data.append('place', place);
    data.append('message', message);
    if (imageFile) data.append('image', imageFile);

    try {
      const res = await apiFetch(`/api/units/${identifier}/checkins/`, {
        method: 'POST',
        body: data,
      });
      if (res.status === 201) {
        window.location.href = unitUrl;
      } else {
        const body = await res.json();
        setErrors(body as Record<string, string[]>);
      }
    } catch (e) {
      console.error(e);
      setErrors({ non_field_errors: ['An unexpected error occurred.'] });
    } finally {
      setSubmitting(false);
    }
  }

  const pickedLatLng: [number, number] | null = location
    ? (location.split(',').map(Number) as [number, number])
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading mb-8 text-3xl font-bold text-char">
        New check-in
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Map */}
        <div>
          <label className="mb-2 block text-sm font-medium text-char">
            Location <span className="text-ember">*</span>
          </label>
          <div className="mb-2 flex items-center gap-3">
            <p className="text-xs text-smoke">Click the map to drop a pin.</p>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geolocating}
              className="rounded-md bg-amber px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {geolocating ? 'Locating…' : 'Use my location'}
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-char/10">
            <MapContainer
              center={[41, 6]}
              zoom={3}
              style={{ height: '320px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker onPick={setLocation} />
              <MapFlyer to={flyTarget} />
              {pickedLatLng && (
                <CircleMarker
                  center={pickedLatLng}
                  radius={10}
                  pathOptions={{
                    color: '#e8a030',
                    fillColor: '#e8a030',
                    fillOpacity: 0.9,
                  }}
                />
              )}
            </MapContainer>
          </div>
          {showPrivacyHint && (
            <div className="mt-2 flex items-start justify-between gap-2 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2">
              <p className="text-xs text-char">
                Exact location set — nudge the pin if you would rather not share
                your precise position.
              </p>
              <button
                type="button"
                onClick={() => setShowPrivacyHint(false)}
                className="shrink-0 text-smoke hover:text-char"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
          {location && (
            <p className="mt-1 text-xs text-smoke">Selected: {location}</p>
          )}
          {errors.location && (
            <p className="mt-1 text-xs text-ember">
              {errors.location.join(' ')}
            </p>
          )}
        </div>

        {/* Place */}
        <div>
          <label
            htmlFor="place"
            className="mb-1 block text-sm font-medium text-char"
          >
            Place
          </label>
          <input
            id="place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder='e.g. "Grande Place, Brussels"'
            className="w-full rounded-lg border border-char/15 px-4 py-3 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
          />
          {errors.place && (
            <p className="mt-1 text-xs text-ember">{errors.place.join(' ')}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="mb-1 block text-sm font-medium text-char"
          >
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Where did you find it? Where are you? What's next for this lighter?"
            className="w-full rounded-lg border border-char/15 px-4 py-3 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
          />
          {errors.message && (
            <p className="mt-1 text-xs text-ember">
              {errors.message.join(' ')}
            </p>
          )}
        </div>

        {/* Image */}
        <div>
          <label
            htmlFor="image"
            className="mb-1 block text-sm font-medium text-char"
          >
            Photo
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-char file:mr-4 file:rounded-lg file:border-0 file:bg-amber/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber hover:file:bg-amber/20"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 max-h-64 rounded-lg object-cover"
            />
          )}
          {errors.image && (
            <p className="mt-1 text-xs text-ember">{errors.image.join(' ')}</p>
          )}
        </div>

        {errors.non_field_errors && (
          <p className="text-sm text-ember">
            {errors.non_field_errors.join(' ')}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Check in'}
          </button>
          <a
            href={unitUrl}
            className="rounded-lg border border-char/15 px-6 py-3 text-sm font-medium text-char hover:bg-linen"
          >
            Cancel
          </a>
        </div>
      </form>
    </main>
  );
}
