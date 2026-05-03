import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMap, { Layer, Source } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';

const MAX_IMAGES = 5;

async function convertToWebP(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Conversion failed'));
          return;
        }
        const name = file.name.replace(/\.[^.]+$/, '.webp');
        resolve(new File([blob], name, { type: 'image/webp' }));
      },
      'image/webp',
      0.85,
    );
  });
}

export interface ExistingImage {
  id: number;
  image: string;
}

export interface CheckinFormInitialData {
  location?: string;
  place?: string;
  message?: string;
  images?: ExistingImage[];
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [geolocating, setGeolocating] = useState(false);
  const [showPrivacyHint, setShowPrivacyHint] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const pickedLatLng: [number, number] | null = location
    ? (location.split(',').map(Number) as [number, number])
    : null;

  const existingImages = (initialData?.images ?? []).filter(
    (img) => !removedImageIds.includes(img.id),
  );
  const totalImages = existingImages.length + imageFiles.length;

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
    const urls = imageFiles.map((f) => {
      const url = URL.createObjectURL(f);
      return url;
    });
    setImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;

    const unsupported = picked.filter(
      (f) => !f.type.startsWith('image/') || f.type === 'image/svg+xml',
    );
    if (unsupported.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: [
          'Only raster images (JPEG, PNG, WebP, etc.) are supported. SVG files cannot be uploaded.',
        ],
      }));
      e.target.value = '';
      return;
    }

    const remaining = MAX_IMAGES - existingImages.length;
    const allowed = picked.slice(0, remaining);

    const converted = await Promise.all(
      allowed.map(async (f) => {
        try {
          return await convertToWebP(f);
        } catch {
          return f;
        }
      }),
    );

    setImageFiles((prev) => {
      const next = [...prev, ...converted];
      return next.slice(0, MAX_IMAGES - existingImages.length);
    });

    if (picked.length > remaining) {
      setErrors((e) => ({
        ...e,
        images: [`Maximum ${MAX_IMAGES} photos per check-in.`],
      }));
    } else {
      setErrors((e) => {
        const next = { ...e };
        delete next.images;
        return next;
      });
    }

    // Reset the input so the same files can be selected again if needed
    e.target.value = '';
  }

  function removeNewImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(id: number) {
    setRemovedImageIds((prev) => [...prev, id]);
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
    imageFiles.forEach((f) => data.append('images', f));
    if (mode === 'edit') {
      data.append('remove_image_ids', JSON.stringify(removedImageIds));
    }

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
            {geolocating ? 'Locating…' : 'Use my location'}
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
          className="w-full rounded-input border border-char/15 bg-white px-4 py-3 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
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
          className="w-full rounded-input border border-char/15 bg-white px-4 py-3 text-sm text-char placeholder-smoke/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-ember">{errors.message.join(' ')}</p>
        )}
      </div>

      {/* Photos */}
      <div>
        <label className="mb-1 block text-sm font-medium text-char">
          Photos
          <span className="ml-1 text-xs font-normal text-smoke">
            (up to {MAX_IMAGES})
          </span>
        </label>

        {/* Existing images (edit mode) */}
        {existingImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={img.image}
                  alt="Existing photo"
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ember text-xs text-white hover:bg-ember/80"
                  aria-label="Remove photo"
                >
                  &#x2715;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New image previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ember text-xs text-white hover:bg-ember/80"
                  aria-label="Remove photo"
                >
                  &#x2715;
                </button>
              </div>
            ))}
          </div>
        )}

        {totalImages < MAX_IMAGES && (
          <input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/heic,image/heif"
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm text-char file:mr-4 file:rounded-btn file:border-0 file:bg-amber/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber hover:file:bg-amber/20"
          />
        )}
        {totalImages >= MAX_IMAGES && (
          <p className="text-xs text-smoke">
            Maximum {MAX_IMAGES} photos reached. Remove one to add another.
          </p>
        )}
        {errors.images && (
          <p className="mt-1 text-xs text-ember">{errors.images.join(' ')}</p>
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
              ? 'Submitting…'
              : 'Saving…'
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
