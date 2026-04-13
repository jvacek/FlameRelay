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
import { NonFieldErrors } from './AllauthErrors';
import { secondaryBtn } from '../styles';

interface SocialAccountManagerProps {
  callbackUrl: string;
  onUnauthorized?: () => void;
}

export default function SocialAccountManager({
  callbackUrl,
  onUnauthorized,
}: SocialAccountManagerProps) {
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
          onUnauthorized?.();
          return;
        }
        setProviders(config.socialaccount?.providers ?? []);
        setLoading(false);
      },
    );
  }, [onUnauthorized]);

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
    return <p className="text-sm text-char/60">Loading&hellip;</p>;
  }

  return (
    <div className="space-y-4">
      <NonFieldErrors errors={errors} />
      {accounts.length === 0 ? (
        <p className="text-sm text-char/50">No social accounts connected.</p>
      ) : (
        <ul className="divide-y divide-char/10">
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
                  className={`${secondaryBtn} bg-ember/10 text-ember`}
                >
                  {disconnecting === key ? 'Disconnecting\u2026' : 'Disconnect'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {availableToConnect.length > 0 && (
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
      )}
    </div>
  );
}
