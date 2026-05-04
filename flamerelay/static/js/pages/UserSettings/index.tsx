import SocialAccountManager from '../../components/SocialAccountManager';
import DeleteAccountSection from './DeleteAccountSection';
import EmailSection from './EmailSection';
import MfaSection from './MfaSection';
import PasskeySection from './PasskeySection';
import ProfileSection from './ProfileSection';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card bg-white p-6 shadow-card">
      <h2 className="font-heading mb-5 text-lg font-semibold text-char">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function UserSettings() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="font-heading mb-8 text-3xl font-bold text-char">
        Settings
      </h1>
      <div className="space-y-8">
        <Section title="Profile">
          <ProfileSection />
        </Section>
        <Section title="Email address">
          <EmailSection />
        </Section>
        <Section title="Two-factor authentication">
          <MfaSection />
        </Section>
        <Section title="Passkeys">
          <PasskeySection />
        </Section>
        <Section title="Connected accounts">
          <SocialAccountManager callbackUrl="/accounts/login/" />
        </Section>
        <Section title="Delete account">
          <DeleteAccountSection />
        </Section>
      </div>
    </main>
  );
}
