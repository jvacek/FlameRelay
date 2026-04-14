import EmailAddressManager from '../components/EmailAddressManager';

interface EmailManageProps {
  loginUrl: string;
}

export default function EmailManage({ loginUrl }: EmailManageProps) {
  return (
    <main className="mx-auto max-w-xl mt-16 rounded-2xl border border-char/10 bg-white px-8 py-10 shadow-sm">
      <h1 className="font-heading mb-6 text-2xl font-bold text-char">
        Email addresses
      </h1>
      <EmailAddressManager
        onUnauthorized={() => {
          window.location.href = loginUrl;
        }}
      />
    </main>
  );
}
