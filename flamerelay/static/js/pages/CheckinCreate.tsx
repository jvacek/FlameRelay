import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';
import { useConfig } from '../lib/useConfig';
import CheckinForm from '../components/CheckinForm';
import ErrorPage from './ErrorPage';

export default function CheckinCreate() {
  const { identifier = '' } = useParams<{ identifier: string }>();
  const config = useConfig();
  const maptilerKey = config?.maptilerKey ?? '';
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const unitUrl = `/unit/${identifier}/`;

  const [isLocationGpsEnforced, setIsLocationGpsEnforced] = useState(false);
  const [gpsDriftAllowanceM, setGpsDriftAllowanceM] = useState(500);
  const [unitLoading, setUnitLoading] = useState(true);
  const [unitNotFound, setUnitNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/units/${identifier}/`).then(async (r) => {
      if (cancelled) return;
      if (!r.ok) {
        setUnitNotFound(true);
        setUnitLoading(false);
        return;
      }
      const data = (await r.json()) as {
        is_location_gps_enforced: boolean;
        game: { max_gps_drift: number } | null;
      };
      setIsLocationGpsEnforced(data.is_location_gps_enforced ?? false);
      if (data.game?.max_gps_drift != null) {
        setGpsDriftAllowanceM(data.game.max_gps_drift);
      }
      setUnitLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [identifier]);

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

  if (unitNotFound) return <ErrorPage code={404} />;

  if (unitLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-smoke">Loading&hellip;</p>
      </main>
    );
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
        isLocationGpsEnforced={isLocationGpsEnforced}
        gpsDriftAllowanceM={gpsDriftAllowanceM}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
