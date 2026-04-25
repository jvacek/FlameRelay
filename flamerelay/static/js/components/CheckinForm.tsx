import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMap, { Layer, Source } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';

export interface CheckinFormInitialData {
  location?: string;
  place?: string;
  message?: string;
  image?: string | null;
}

interface CheckinFormProps {
  mode: 'create' | 'edit';
  initialData?: CheckinFormInitialData;
  unitUrl: string;
  maptilerKey: string;
  onSubmit: (data: FormData) => Promise<Record<string, string[]> | null>;
}

export default function CheckinForm({
  mode,
  initialData,
  unitUrl,
  maptilerKey,
  onSubmit,
}: CheckinFormProps) {
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [place, setPlace] = useState(initialData?.place ?? '');
  const [message, setMessage] = useState(initialData?.message ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [geolocating, setGeolocating] = useState(false);
  const [showPrivacyHint, setShowPrivacyHint] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const pickedLatLng: [number, number] | null = location
    ? (location.split(',').map(Number) as [number, number])
    : null;

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setLocation(`${lat},${lng}`);
        setShowPrivacyHint(true);
        setGeolocating(false);
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
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

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    // URL.createObjectURL always returns blob: URLs; validate explicitly for security tooling
    if (new URL(objectUrl).protocol !== 'blob:') {
      URL.revokeObjectURL(objectUrl);
      setImagePreview(null);
      return;
    }
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImageFile(e.target.files?.[0] ?? null);
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
      const errs = await onSubmit(data);
      if (errs) setErrors(errs);
    } catch (err) {
      console.error(err);
      setErrors({ non_field_errors: ['An unexpected error occurred.'] });
    } finally {
      setSubmitting(false);
    }
  }

  const isCreate = mode === 'create';

  const pinGeoJSON = useMemo(() => {
    if (!location) return { type: 'FeatureCollection' as const, features: [] };
    const [lat, lng] = location.split(',').map(Number);
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [lng, lat] },
          properties: {},
        },
      ],
    };
  }, [location]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Map */}
      <div>
        <label className="mb-2 block text-sm font-medium text-char">
          Location{isCreate && <span className="text-ember"> *</span>}
        </label>
        <div className="mb-2 flex items-center gap-3">
          <p className="text-xs text-smoke">
            {isCreate
              ? 'Click the map to drop a pin.'
              : 'Click the map to move the pin.'}
          </p>
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geolocating}
            className="rounded-btn bg-amber px-3 py-1 text-xs font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
          >
            {geolocating ? 'Locating\u2026' : 'Use my location'}
          </button>
        </div>
        <div className="overflow-hidden rounded-card border border-char/10">
          <ReactMap
            ref={mapRef}
            mapStyle={`https://api.maptiler.com/maps/dataviz/style.json?key=${maptilerKey}`}
            initialViewState={{
              longitude: pickedLatLng ? pickedLatLng[1] : 6,
              latitude: pickedLatLng ? pickedLatLng[0] : 41,
              zoom: pickedLatLng ? 8 : 3,
            }}
            style={{ height: '320px', width: '100%' }}
            cursor="crosshair"
            onClick={(e) => {
              const { lng, lat } = e.lngLat;
              setLocation(`${lat},${lng}`);
            }}
          >
            <Source id="pin" type="geojson" data={pinGeoJSON}>
              <Layer
                id="pin-circle"
                type="circle"
                paint={{
                  'circle-radius': 10,
                  'circle-color': '#e8a030',
                  'circle-opacity': 0.9,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                }}
              />
            </Source>
          </ReactMap>
        </div>
        {showPrivacyHint && (
          <div className="mt-2 flex items-start justify-between gap-2 rounded-card border border-amber/30 bg-amber/10 px-3 py-2">
            <p className="text-xs text-char">
              Exact location set &mdash; nudge the pin if you would rather not
              share your precise position.
            </p>
            <button
              type="button"
              onClick={() => setShowPrivacyHint(false)}
              className="shrink-0 text-smoke hover:text-char"
              aria-label="Dismiss"
            >
              &#x2715;
            </button>
          </div>
        )}
        {location && (
          <p className="mt-1 text-xs text-smoke">Selected: {location}</p>
        )}
        {errors.location && (
          <p className="mt-1 text-xs text-ember">{errors.location.join(' ')}</p>
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
          className="w-full rounded-input border border-char/15 px-4 py-3 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
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
          placeholder={
            isCreate
              ? "Where did you find it? Where are you? What's next for this lighter?"
              : undefined
          }
          className="w-full rounded-input border border-char/15 px-4 py-3 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-ember">{errors.message.join(' ')}</p>
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
        {initialData?.image && !imagePreview && (
          <img
            src={initialData.image}
            alt="Current photo"
            className="mb-2 max-h-48 rounded-lg object-cover"
          />
        )}
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-char file:mr-4 file:rounded-btn file:border-0 file:bg-amber/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber hover:file:bg-amber/20"
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

      {isCreate && (
        <p className="text-xs italic text-smoke">
          Once someone else checks in after you, the lighter moves on &mdash;
          you won&apos;t be able to add more check-ins.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-btn bg-amber px-[22px] py-[9px] text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting
            ? isCreate
              ? 'Submitting\u2026'
              : 'Saving\u2026'
            : isCreate
              ? 'Check in'
              : 'Save changes'}
        </button>
        <a
          href={unitUrl}
          className="rounded-btn border border-char/15 px-[22px] py-[9px] text-sm font-medium text-char transition-colors hover:bg-linen"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
