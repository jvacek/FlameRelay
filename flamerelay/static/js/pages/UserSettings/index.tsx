import { useAuth } from '../../AuthContext';
import SocialAccountManager from '../../components/SocialAccountManager';
import EmailSection from './EmailSection';
import MfaSection from './MfaSection';
import ProfileSection from './ProfileSection';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-char/10 pt-8">
      <h2 className="font-heading mb-5 text-lg font-semibold text-char">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function UserSettings() {
  const { username } = useAuth();
  const updateUrl = `/api/users/${username}/`;

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="font-heading mb-8 text-3xl font-bold text-char">
        Settings
      </h1>
      <div className="space-y-8">
        <Section title="Profile">
          <ProfileSection updateUrl={updateUrl} />
        </Section>
        <Section title="Email address">
          <EmailSection />
        </Section>
        <Section title="Two-factor authentication">
          <MfaSection />
        </Section>
        <Section title="Connected accounts">
          <SocialAccountManager callbackUrl="/accounts/login/" />
        </Section>
      </div>
    </main>
  );
}
