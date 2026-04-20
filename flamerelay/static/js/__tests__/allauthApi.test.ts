import { hasPendingFlow, redirectToProvider } from '../lib/allauthApi';
import type { AllauthResponse } from '../lib/allauthApi';

describe('hasPendingFlow', () => {
  it('returns false when data is undefined', () => {
    const resp: AllauthResponse = { status: 200 };
    expect(hasPendingFlow(resp, 'mfa_authenticate')).toBe(false);
  });

  it('returns false when data is an array', () => {
    const resp: AllauthResponse = { status: 200, data: [] };
    expect(hasPendingFlow(resp, 'mfa_authenticate')).toBe(false);
  });

  it('returns false when flows is missing from data', () => {
    const resp: AllauthResponse = { status: 200, data: { user: {} } };
    expect(hasPendingFlow(resp, 'mfa_authenticate')).toBe(false);
  });

  it('returns false when the flow id is not in the list', () => {
    const resp: AllauthResponse = {
      status: 200,
      data: { flows: [{ id: 'login', is_pending: true }] },
    };
    expect(hasPendingFlow(resp, 'mfa_authenticate')).toBe(false);
  });

  it('returns false when the flow exists but is not pending', () => {
    const resp: AllauthResponse = {
      status: 200,
      data: { flows: [{ id: 'mfa_authenticate', is_pending: false }] },
    };
    expect(hasPendingFlow(resp, 'mfa_authenticate')).toBe(false);
  });

  it('returns false when the flow exists but is_pending is undefined', () => {
    const resp: AllauthResponse = {
      status: 200,
      data: { flows: [{ id: 'mfa_authenticate' }] },
    };
    expect(hasPendingFlow(resp, 'mfa_authenticate')).toBe(false);
  });

  it('returns true when the flow is present and pending', () => {
    const resp: AllauthResponse = {
      status: 200,
      data: { flows: [{ id: 'mfa_authenticate', is_pending: true }] },
    };
    expect(hasPendingFlow(resp, 'mfa_authenticate')).toBe(true);
  });

  it('matches only the exact flow id among multiple flows', () => {
    const resp: AllauthResponse = {
      status: 200,
      data: {
        flows: [
          { id: 'login', is_pending: true },
          { id: 'mfa_authenticate', is_pending: true },
        ],
      },
    };
    expect(hasPendingFlow(resp, 'mfa_authenticate')).toBe(true);
    expect(hasPendingFlow(resp, 'signup')).toBe(false);
  });
});

describe('redirectToProvider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.spyOn(document, 'cookie', 'get').mockReturnValue('csrftoken=csrf-xyz');
    jest
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function getForm(): HTMLFormElement {
    return document.body.querySelector('form') as HTMLFormElement;
  }

  function getFields(form: HTMLFormElement): Record<string, string> {
    const fields: Record<string, string> = {};
    form.querySelectorAll('input[type="hidden"]').forEach((el) => {
      const input = el as HTMLInputElement;
      fields[input.name] = input.value;
    });
    return fields;
  }

  it('creates a POST form targeting the allauth provider redirect endpoint', () => {
    redirectToProvider('google', '/accounts/google/login/callback/');
    const form = getForm();
    expect(form.method).toBe('post');
    expect(form.action).toContain(
      '/_allauth/browser/v1/auth/provider/redirect',
    );
  });

  it('populates all required hidden fields', () => {
    redirectToProvider('google', '/callback/', 'connect');
    const fields = getFields(getForm());
    expect(fields['provider']).toBe('google');
    expect(fields['process']).toBe('connect');
    expect(fields['callback_url']).toBe('http://localhost/callback/');
    expect(fields['csrfmiddlewaretoken']).toBe('csrf-xyz');
  });

  it('defaults process to login', () => {
    redirectToProvider('facebook', '/callback/');
    expect(getFields(getForm())['process']).toBe('login');
  });

  it('submits the form', () => {
    const submitSpy = jest.spyOn(HTMLFormElement.prototype, 'submit');
    redirectToProvider('google', '/callback/');
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });
});
