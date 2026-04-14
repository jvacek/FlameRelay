import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import CheckinForm, {
  type CheckinFormInitialData,
} from '../components/CheckinForm';

interface CheckinEditProps {
  identifier: string;
  checkinId: number;
  unitUrl: string;
}

interface CheckInData {
  id: number;
  location: string;
  place: string;
  message: string;
  image: string | null;
}

export default function CheckinEdit({
  identifier,
  checkinId,
  unitUrl,
}: CheckinEditProps) {
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<CheckinFormInitialData>({});

  useEffect(() => {
    fetch(`/api/units/${identifier}/checkins/`)
      .then((r) => r.json())
      .then((data: CheckInData[] | { results: CheckInData[] }) => {
        const list = Array.isArray(data) ? data : data.results;
        const checkin = list.find((c) => c.id === checkinId);
        if (checkin) {
          setInitialData({
            location: checkin.location,
            place: checkin.place,
            message: checkin.message,
            image: checkin.image,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [identifier, checkinId]);

  async function handleSubmit(data: FormData) {
    const res = await apiFetch(
      `/api/units/${identifier}/checkins/${checkinId}/`,
      { method: 'PATCH', body: data },
    );
    if (res.ok) {
      window.location.href = unitUrl;
      return null;
    }
    return (await res.json()) as Record<string, string[]>;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-smoke">
        Loading&hellip;
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading mb-8 text-3xl font-bold text-char">
        Edit check-in
      </h1>
      <CheckinForm
        mode="edit"
        initialData={initialData}
        unitUrl={unitUrl}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
