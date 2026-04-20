import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';
import { useConfig } from '../lib/useConfig';
import CheckinForm from '../components/CheckinForm';

export default function CheckinCreate() {
  const { identifier = '' } = useParams<{ identifier: string }>();
  const config = useConfig();
  const maptilerKey = config?.maptilerKey ?? '';
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const unitUrl = `/unit/${identifier}/`;

  async function handleSubmit(data: FormData) {
    const res = await apiFetch(`/api/units/${identifier}/checkins/`, {
      method: 'POST',
      body: data,
    });
    if (res.status === 201) {
      navigate(unitUrl);
      return null;
    }
    if (res.status === 401) {
      await refresh();
      navigate('/accounts/login/');
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
