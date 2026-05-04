import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasskeySection from '../pages/UserSettings/PasskeySection';
import {
  getPasskeys,
  beginPasskeyRegistration,
  completePasskeyRegistration,
  deletePasskey,
  reauthenticateWithPassword,
  reauthenticateWithCode,
  requestLoginCode,
  type AllauthResponse,
} from '../lib/allauthApi';
import {
  startRegistration,
  browserSupportsWebAuthn,
  type RegistrationResponseJSON,
} from '@simplewebauthn/browser';

jest.mock('../lib/allauthApi');
jest.mock('@simplewebauthn/browser');

const mockGetPasskeys = jest.mocked(getPasskeys);
const mockBeginPasskeyRegistration = jest.mocked(beginPasskeyRegistration);
const mockCompletePasskeyRegistration = jest.mocked(
  completePasskeyRegistration,
);
const mockDeletePasskey = jest.mocked(deletePasskey);
const mockReauthenticateWithPassword = jest.mocked(reauthenticateWithPassword);
const mockReauthenticateWithCode = jest.mocked(reauthenticateWithCode);
const mockRequestLoginCode = jest.mocked(requestLoginCode);
const mockStartRegistration = jest.mocked(startRegistration);
const mockBrowserSupportsWebAuthn = jest.mocked(browserSupportsWebAuthn);

const PASSKEY = {
  type: 'webauthn',
  id: 1,
  name: 'Touch ID',
  created_at: 1700000000,
  last_used_at: null,
};

const CREATION_OPTIONS_RESP = {
  status: 200,
  data: {
    creation_options: {
      publicKey: {
        challenge: 'abc123',
        rp: { id: 'localhost', name: 'LitRoute' },
      },
    },
  },
} as unknown as AllauthResponse;

function reauthResp(hasPassword: boolean): AllauthResponse {
  return {
    status: 401,
    data: {
      flows: [{ id: 'reauthenticate' }],
      user: { email: 'user@example.com', has_usable_password: hasPassword },
    },
  } as AllauthResponse;
}

describe('PasskeySection', () => {
  beforeEach(() => {
    mockBrowserSupportsWebAuthn.mockReturnValue(true);
    mockGetPasskeys.mockResolvedValue({ status: 200, data: [] });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('browser support', () => {
    it('shows unsupported message when browser does not support passkeys', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(false);
      render(<PasskeySection />);
      expect(screen.getByText(/doesn't support passkeys/i)).toBeInTheDocument();
    });
  });

  describe('list view', () => {
    it('shows loading state while fetching', () => {
      mockGetPasskeys.mockReturnValue(new Promise(() => {}));
      render(<PasskeySection />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows empty state when no passkeys are registered', async () => {
      render(<PasskeySection />);
      await screen.findByText(/no passkeys registered yet/i);
      expect(
        screen.getByRole('button', { name: /add a passkey/i }),
      ).toBeInTheDocument();
    });

    it('renders registered passkeys with their names', async () => {
      mockGetPasskeys.mockResolvedValue({ status: 200, data: [PASSKEY] });
      render(<PasskeySection />);
      await screen.findByText('Touch ID');
      expect(
        screen.getByRole('button', { name: /remove/i }),
      ).toBeInTheDocument();
    });

    it('filters out non-webauthn authenticators', async () => {
      mockGetPasskeys.mockResolvedValue({
        status: 200,
        data: [
          PASSKEY,
          {
            type: 'totp',
            id: 2,
            name: 'Authenticator App',
            created_at: 1700000000,
            last_used_at: null,
          },
        ],
      });
      render(<PasskeySection />);
      await screen.findByText('Touch ID');
      expect(screen.queryByText('Authenticator App')).not.toBeInTheDocument();
    });

    it('calls deletePasskey with the correct id when Remove is clicked', async () => {
      mockGetPasskeys.mockResolvedValue({ status: 200, data: [PASSKEY] });
      mockDeletePasskey.mockResolvedValue({ status: 204 });
      render(<PasskeySection />);
      await screen.findByText('Touch ID');
      fireEvent.click(screen.getByRole('button', { name: /remove/i }));
      await waitFor(() => expect(mockDeletePasskey).toHaveBeenCalledWith(1));
    });

    it('shows an error when removal fails', async () => {
      mockGetPasskeys.mockResolvedValue({ status: 200, data: [PASSKEY] });
      mockDeletePasskey.mockResolvedValue({
        status: 400,
        errors: [{ message: 'Failed to remove passkey.' }],
      });
      render(<PasskeySection />);
      await screen.findByText('Touch ID');
      fireEvent.click(screen.getByRole('button', { name: /remove/i }));
      await screen.findByText(/failed to remove passkey/i);
    });
  });

  describe('adding view', () => {
    async function openAddingView() {
      render(<PasskeySection />);
      await screen.findByText(/no passkeys registered yet/i);
      fireEvent.click(screen.getByRole('button', { name: /add a passkey/i }));
    }

    it('shows the passkey name form', async () => {
      await openAddingView();
      expect(screen.getByLabelText(/passkey name/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /register passkey/i }),
      ).toBeInTheDocument();
    });

    it('returns to list when Cancel is clicked', async () => {
      await openAddingView();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      await screen.findByText(/no passkeys registered yet/i);
    });

    it('completes registration and returns to list view', async () => {
      mockBeginPasskeyRegistration.mockResolvedValue(CREATION_OPTIONS_RESP);
      mockStartRegistration.mockResolvedValue({
        id: 'cred-id',
        rawId: 'raw',
      } as unknown as RegistrationResponseJSON);
      mockCompletePasskeyRegistration.mockResolvedValue({ status: 201 });

      await openAddingView();
      fireEvent.change(screen.getByLabelText(/passkey name/i), {
        target: { value: 'Work laptop' },
      });
      fireEvent.submit(screen.getByLabelText(/passkey name/i).closest('form')!);

      await waitFor(() =>
        expect(mockCompletePasskeyRegistration).toHaveBeenCalledWith(
          { id: 'cred-id', rawId: 'raw' },
          'Work laptop',
        ),
      );
      await screen.findByText(/no passkeys registered yet/i);
    });

    it('uses "My passkey" as default name when field is left empty', async () => {
      mockBeginPasskeyRegistration.mockResolvedValue(CREATION_OPTIONS_RESP);
      mockStartRegistration.mockResolvedValue({
        id: 'cred-id',
      } as unknown as RegistrationResponseJSON);
      mockCompletePasskeyRegistration.mockResolvedValue({ status: 201 });

      await openAddingView();
      fireEvent.submit(screen.getByLabelText(/passkey name/i).closest('form')!);

      await waitFor(() =>
        expect(mockCompletePasskeyRegistration).toHaveBeenCalledWith(
          expect.anything(),
          'My passkey',
        ),
      );
    });

    it('shows error when the browser passkey prompt is dismissed', async () => {
      mockBeginPasskeyRegistration.mockResolvedValue(CREATION_OPTIONS_RESP);
      mockStartRegistration.mockRejectedValue(new Error('User cancelled'));

      await openAddingView();
      fireEvent.submit(screen.getByLabelText(/passkey name/i).closest('form')!);

      await screen.findByText(/passkey registration was cancelled/i);
    });

    it('shows error when completePasskeyRegistration fails', async () => {
      mockBeginPasskeyRegistration.mockResolvedValue(CREATION_OPTIONS_RESP);
      mockStartRegistration.mockResolvedValue({
        id: 'cred-id',
      } as unknown as RegistrationResponseJSON);
      mockCompletePasskeyRegistration.mockResolvedValue({
        status: 400,
        errors: [{ message: 'Registration failed on server.' }],
      });

      await openAddingView();
      fireEvent.submit(screen.getByLabelText(/passkey name/i).closest('form')!);

      await screen.findByText(/registration failed on server/i);
    });
  });

  describe('reauth view', () => {
    async function triggerReauth(hasPassword: boolean) {
      mockBeginPasskeyRegistration.mockResolvedValue(reauthResp(hasPassword));
      render(<PasskeySection />);
      await screen.findByText(/no passkeys registered yet/i);
      fireEvent.click(screen.getByRole('button', { name: /add a passkey/i }));
      fireEvent.submit(screen.getByLabelText(/passkey name/i).closest('form')!);
      await screen.findByText(/confirm your identity/i);
    }

    it('shows password form when user has a password', async () => {
      await triggerReauth(true);
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('shows send-code button when user has no password', async () => {
      await triggerReauth(false);
      expect(
        screen.getByRole('button', { name: /send code/i }),
      ).toBeInTheDocument();
    });

    it('returns to list when Cancel is clicked in reauth', async () => {
      await triggerReauth(true);
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      await screen.findByText(/no passkeys registered yet/i);
    });

    it('moves to adding view after successful password reauth', async () => {
      mockReauthenticateWithPassword.mockResolvedValue({ status: 200 });
      await triggerReauth(true);
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'hunter2' },
      });
      fireEvent.submit(screen.getByLabelText(/password/i).closest('form')!);
      await screen.findByLabelText(/passkey name/i);
    });

    it('shows error on wrong password', async () => {
      mockReauthenticateWithPassword.mockResolvedValue({
        status: 400,
        errors: [{ message: 'Incorrect password. Please try again.' }],
      });
      await triggerReauth(true);
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrong' },
      });
      fireEvent.submit(screen.getByLabelText(/password/i).closest('form')!);
      await screen.findByText(/incorrect password/i);
    });

    it('shows verification code input after sending code', async () => {
      mockRequestLoginCode.mockResolvedValue({ ok: true });
      await triggerReauth(false);
      fireEvent.click(screen.getByRole('button', { name: /send code/i }));
      await screen.findByLabelText(/verification code/i);
    });

    it('moves to adding view after successful code reauth', async () => {
      mockRequestLoginCode.mockResolvedValue({ ok: true });
      mockReauthenticateWithCode.mockResolvedValue({ status: 200 });
      await triggerReauth(false);
      fireEvent.click(screen.getByRole('button', { name: /send code/i }));
      await screen.findByLabelText(/verification code/i);
      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '123456' },
      });
      fireEvent.submit(
        screen.getByLabelText(/verification code/i).closest('form')!,
      );
      await screen.findByLabelText(/passkey name/i);
    });

    it('shows error on wrong verification code', async () => {
      mockRequestLoginCode.mockResolvedValue({ ok: true });
      mockReauthenticateWithCode.mockResolvedValue({
        status: 400,
        errors: [{ message: 'Invalid code. Please try again.' }],
      });
      await triggerReauth(false);
      fireEvent.click(screen.getByRole('button', { name: /send code/i }));
      await screen.findByLabelText(/verification code/i);
      fireEvent.change(screen.getByLabelText(/verification code/i), {
        target: { value: '000000' },
      });
      fireEvent.submit(
        screen.getByLabelText(/verification code/i).closest('form')!,
      );
      await screen.findByText(/invalid code/i);
    });
  });
});
