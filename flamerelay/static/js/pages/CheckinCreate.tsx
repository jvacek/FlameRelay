import { apiFetch } from '../api';
import CheckinForm from '../components/CheckinForm';

interface CheckinCreateProps {
  identifier: string;
  unitUrl: string;
  maptilerKey: string;
}

export default function CheckinCreate({
  identifier,
  unitUrl,
  maptilerKey,
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
    const json = (await res.json()) as Record<string, string[]> & {
      detail?: string;
    };
    if (json.detail) {
      return { non_field_errors: [json.detail] };
    }
    return json;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading mb-8 text-3xl font-bold text-char">
        New check-in
      </h1>
      <CheckinForm
        mode="create"
        unitUrl={unitUrl}
        maptilerKey={maptilerKey}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
