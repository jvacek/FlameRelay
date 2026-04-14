import SocialAccountManager from '../components/SocialAccountManager';

interface SocialConnectionsProps {
  loginUrl: string;
  callbackUrl: string;
}

export default function SocialConnections({
  loginUrl,
  callbackUrl,
}: SocialConnectionsProps) {
  return (
    <main className="mx-auto max-w-xl mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-6 text-2xl font-bold text-char">
        Connected accounts
      </h1>
      <SocialAccountManager
        callbackUrl={callbackUrl}
        onUnauthorized={() => {
          window.location.href = loginUrl;
        }}
      />
    </main>
  );
}
