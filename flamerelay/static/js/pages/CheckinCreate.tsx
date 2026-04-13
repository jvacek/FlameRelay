import { apiFetch } from '../api';
import CheckinForm from '../components/CheckinForm';

interface CheckinCreateProps {
  identifier: string;
  unitUrl: string;
}

export default function CheckinCreate({
  identifier,
  unitUrl,
}: CheckinCreateProps) {
  async function handleSubmit(data: FormData) {
    const res = await apiFetch(`/api/units/${identifier}/checkins/`, {
      method: 'POST',
      body: data,
    });
    if (res.status === 201) {
      window.location.href = unitUrl;
      return null;
    }
    return (await res.json()) as Record<string, string[]>;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading mb-8 text-3xl font-bold text-char">
        New check-in
      </h1>
      <CheckinForm mode="create" unitUrl={unitUrl} onSubmit={handleSubmit} />
    </main>
  );
}
