import { useState, useEffect } from 'react';
import {
  getConnectedAccounts,
  disconnectAccount,
  getConfig,
  redirectToProvider,
  type ConnectedAccount,
  type SocialProvider,
  type AllauthError,
} from '../lib/allauthApi';
import { NonFieldErrors } from '../components/AllauthErrors';

interface SocialConnectionsProps {
  loginUrl: string;
  callbackUrl: string;
}

export default function SocialConnections({
  loginUrl,
  callbackUrl,
}: SocialConnectionsProps) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [errors, setErrors] = useState<AllauthError[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getConnectedAccounts(), getConfig()]).then(
      ([accountsResp, config]) => {
        if (accountsResp.status === 200 && Array.isArray(accountsResp.data)) {
          setAccounts(accountsResp.data as ConnectedAccount[]);
        } else if (accountsResp.status === 401) {
          window.location.href = loginUrl;
          return;
        }
        setProviders(config.socialaccount?.providers ?? []);
        setLoading(false);
      },
    );
  }, [loginUrl]);

  async function handleDisconnect(account: ConnectedAccount) {
    const key = `${account.provider.id}:${account.uid}`;
    setDisconnecting(key);
    setErrors([]);
    try {
      const resp = await disconnectAccount(account.provider.id, account.uid);
      if (resp.status === 200 && Array.isArray(resp.data)) {
        setAccounts(resp.data as ConnectedAccount[]);
      } else {
        setErrors(
          resp.errors ?? [{ message: 'Failed to disconnect account.' }],
        );
      }
    } finally {
      setDisconnecting(null);
    }
  }

  const connectedIds = new Set(accounts.map((a) => a.provider.id));
  const availableToConnect = providers.filter((p) => !connectedIds.has(p.id));

  if (loading) {
    return (
      <main className="mx-auto max-w-xl mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
        <p className="text-sm text-char/60">Loading&hellip;</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-6 text-2xl font-bold text-char">
        Connected accounts
      </h1>
      <NonFieldErrors errors={errors} />

      {accounts.length === 0 ? (
        <p className="mb-6 text-sm text-char/50">
          No social accounts connected.
        </p>
      ) : (
        <ul className="mb-6 divide-y divide-char/10">
          {accounts.map((account) => {
            const key = `${account.provider.id}:${account.uid}`;
            return (
              <li key={key} className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <span className="text-sm font-medium text-char">
                    {account.provider.name}
                  </span>
                  <p className="text-xs text-char/50">{account.display}</p>
                </div>
                <button
                  onClick={() => handleDisconnect(account)}
                  disabled={disconnecting !== null}
                  className="rounded px-2.5 py-1 text-xs font-medium bg-ember/10 text-ember transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {disconnecting === key ? 'Disconnecting\u2026' : 'Disconnect'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {availableToConnect.length > 0 && (
        <div className="border-t border-char/10 pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-char/70">
            Connect an account
          </h2>
          <div className="flex flex-col gap-2">
            {availableToConnect.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() =>
                  redirectToProvider(provider.id, callbackUrl, 'connect')
                }
                className="flex w-full items-center gap-3 rounded-lg border border-char/15 px-4 py-2.5 text-sm font-medium text-char transition-colors hover:bg-linen"
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
