import { getCsrfToken } from '../api';

const BASE = '/_allauth/browser/v1';

export interface AllauthError {
  param?: string;
  message: string;
  code?: string;
}

export interface AllauthFlow {
  id: string;
  is_pending?: boolean;
}

export interface AllauthResponse {
  status: number;
  data?:
    | {
        flows?: AllauthFlow[];
        user?: Record<string, unknown>;
        email?: string;
      }
    | unknown[];
  errors?: AllauthError[];
  meta?: {
    is_authenticated: boolean;
  };
}

async function allauthFetch(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Promise<AllauthResponse> {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    method.toUpperCase(),
  );
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Accept: 'application/json',
      ...(mutating ? { 'X-CSRFToken': getCsrfToken() } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<AllauthResponse>;
}

export function hasPendingFlow(resp: AllauthResponse, flowId: string): boolean {
  if (!resp.data || Array.isArray(resp.data)) return false;
  return (
    resp.data.flows?.some((f) => f.id === flowId && f.is_pending === true) ??
    false
  );
}

export async function login(
  email: string,
  password: string,
): Promise<AllauthResponse> {
  return allauthFetch('POST', '/auth/login', { email, password });
}

export async function requestLoginCode(
  email: string,
): Promise<AllauthResponse> {
  return allauthFetch('POST', '/auth/code/request', { email });
}

export async function confirmLoginCode(code: string): Promise<AllauthResponse> {
  return allauthFetch('POST', '/auth/code/confirm', { code });
}

export async function mfaAuthenticate(code: string): Promise<AllauthResponse> {
  return allauthFetch('POST', '/auth/2fa/authenticate', { code });
}

export async function logout(): Promise<AllauthResponse> {
  return allauthFetch('DELETE', '/auth/session');
}

export interface SignUpData {
  email: string;
  username: string;
  password1: string;
  password2: string;
}

export async function signUp(data: SignUpData): Promise<AllauthResponse> {
  return allauthFetch(
    'POST',
    '/auth/signup',
    data as unknown as Record<string, unknown>,
  );
}

// Email verification
export async function getEmailVerification(
  key: string,
): Promise<AllauthResponse> {
  return allauthFetch('GET', '/auth/email/verify', undefined, {
    'X-Email-Verification-Key': key,
  });
}

export async function verifyEmail(key: string): Promise<AllauthResponse> {
  return allauthFetch('POST', '/auth/email/verify', { key });
}

// Password reset
export async function requestPasswordReset(
  email: string,
): Promise<AllauthResponse> {
  return allauthFetch('POST', '/auth/password/request', { email });
}

export async function getPasswordReset(key: string): Promise<AllauthResponse> {
  return allauthFetch('GET', '/auth/password/reset', undefined, {
    'X-Password-Reset-Key': key,
  });
}

export async function resetPassword(
  key: string,
  password: string,
): Promise<AllauthResponse> {
  return allauthFetch('POST', '/auth/password/reset', { key, password });
}

// Email address management
export interface EmailAddress {
  email: string;
  primary: boolean;
  verified: boolean;
}

export async function getEmailAddresses(): Promise<AllauthResponse> {
  return allauthFetch('GET', '/account/email');
}

export async function addEmail(email: string): Promise<AllauthResponse> {
  return allauthFetch('POST', '/account/email', { email });
}

export async function deleteEmail(email: string): Promise<AllauthResponse> {
  return allauthFetch('DELETE', '/account/email', { email });
}

export async function markEmailAsPrimary(
  email: string,
): Promise<AllauthResponse> {
  return allauthFetch('PATCH', '/account/email', { email, primary: true });
}

export async function requestEmailVerification(
  email: string,
): Promise<AllauthResponse> {
  return allauthFetch('PUT', '/account/email', { email });
}

export interface SocialProvider {
  id: string;
  name: string;
  flows: string[];
}

export interface ConnectedAccount {
  uid: string;
  provider: SocialProvider;
  display: string;
}

export async function getConnectedAccounts(): Promise<AllauthResponse> {
  return allauthFetch('GET', '/account/providers');
}

export async function disconnectAccount(
  providerId: string,
  uid: string,
): Promise<AllauthResponse> {
  return allauthFetch('DELETE', '/account/providers', {
    provider: providerId,
    account: uid,
  });
}

export interface AllauthConfig {
  account: Record<string, unknown>;
  socialaccount?: { providers: SocialProvider[] };
}

export async function getConfig(): Promise<AllauthConfig> {
  const resp = await fetch(BASE + '/config', {
    headers: { Accept: 'application/json' },
  });
  const json = (await resp.json()) as { status: number; data: AllauthConfig };
  return json.data;
}

export function redirectToProvider(
  providerId: string,
  callbackUrl: string,
  process: 'login' | 'connect' = 'login',
): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = BASE + '/auth/provider/redirect';
  const fields: Record<string, string> = {
    provider: providerId,
    process,
    callback_url: window.location.origin + callbackUrl,
    csrfmiddlewaretoken: getCsrfToken(),
  };
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
