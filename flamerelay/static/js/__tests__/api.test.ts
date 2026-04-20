import { getCsrfToken, apiFetch } from '../api';

describe('getCsrfToken', () => {
  let cookieSpy: jest.SpyInstance;

  beforeEach(() => {
    cookieSpy = jest.spyOn(document, 'cookie', 'get');
  });

  afterEach(() => {
    cookieSpy.mockRestore();
  });

  it('returns empty string when there are no cookies', () => {
    cookieSpy.mockReturnValue('');
    expect(getCsrfToken()).toBe('');
  });

  it('returns empty string when csrftoken is absent', () => {
    cookieSpy.mockReturnValue('session=xyz; other=val');
    expect(getCsrfToken()).toBe('');
  });

  it('extracts a plain csrftoken', () => {
    cookieSpy.mockReturnValue('csrftoken=abc123');
    expect(getCsrfToken()).toBe('abc123');
  });

  it('extracts a __Secure- prefixed csrftoken', () => {
    cookieSpy.mockReturnValue('__Secure-csrftoken=secureval');
    expect(getCsrfToken()).toBe('secureval');
  });

  it('URL-decodes the token value', () => {
    cookieSpy.mockReturnValue('csrftoken=hello%20world');
    expect(getCsrfToken()).toBe('hello world');
  });

  it('extracts csrftoken from among multiple cookies', () => {
    cookieSpy.mockReturnValue('session=xyz; csrftoken=mytoken; other=val');
    expect(getCsrfToken()).toBe('mytoken');
  });
});

describe('apiFetch', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest
      .spyOn(document, 'cookie', 'get')
      .mockReturnValue('csrftoken=test-csrf');
    mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function capturedHeaders(): Record<string, string> {
    return mockFetch.mock.calls[0][1].headers as Record<string, string>;
  }

  it('does not inject X-CSRFToken for GET requests', async () => {
    await apiFetch('/api/test/', { method: 'GET' });
    expect(capturedHeaders()['X-CSRFToken']).toBeUndefined();
  });

  it('defaults to GET when no method is provided', async () => {
    await apiFetch('/api/test/');
    expect(capturedHeaders()['X-CSRFToken']).toBeUndefined();
  });

  it('injects X-CSRFToken for POST requests', async () => {
    await apiFetch('/api/test/', { method: 'POST' });
    expect(capturedHeaders()['X-CSRFToken']).toBe('test-csrf');
  });

  it.each(['PATCH', 'PUT', 'DELETE'])(
    'injects X-CSRFToken for %s requests',
    async (method) => {
      await apiFetch('/api/test/', { method });
      expect(capturedHeaders()['X-CSRFToken']).toBe('test-csrf');
    },
  );

  it('preserves caller-provided headers alongside the CSRF token', async () => {
    await apiFetch('/api/test/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
    });
    const headers = capturedHeaders();
    expect(headers['X-CSRFToken']).toBe('test-csrf');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Custom']).toBe('value');
  });
});
