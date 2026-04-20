import '../css/project.css';

import { createRoot } from 'react-dom/client';
import Navbar from './components/Navbar';
import About from './pages/About';
import EmailConfirm from './pages/EmailConfirm';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SocialConnections from './pages/SocialConnections';
import Unit from './pages/Unit';
import CheckinCreate from './pages/CheckinCreate';
import CheckinEdit from './pages/CheckinEdit';
import UserDetail from './pages/UserDetail';
import UserForm from './pages/UserForm';
import UserSettings from './pages/UserSettings';
import ErrorPage from './pages/ErrorPage';

// Navbar — present on every page
const navbarRoot = document.getElementById('navbar-root');
if (navbarRoot) {
  const d = navbarRoot.dataset;
  createRoot(navbarRoot).render(
    <Navbar
      isAuthenticated={d.isAuthenticated === 'true'}
      username={d.username ?? ''}
      homeUrl={d.homeUrl ?? '/'}
      aboutUrl={d.aboutUrl ?? '/about/'}
      loginUrl={d.loginUrl ?? '/accounts/login/'}
      profileUrl={d.profileUrl ?? ''}
    />,
  );
}

// Login page
const loginRoot = document.getElementById('login-root');
if (loginRoot) {
  const d = loginRoot.dataset;
  createRoot(loginRoot).render(
    <Login nextUrl={d.nextUrl ?? ''} redirectUrl={d.redirectUrl ?? ''} />,
  );
}

// Signup page
const signupRoot = document.getElementById('signup-root');
if (signupRoot) {
  const d = signupRoot.dataset;
  createRoot(signupRoot).render(
    <Signup loginUrl={d.loginUrl ?? ''} redirectUrl={d.redirectUrl ?? ''} />,
  );
}

// Home page
const homeRoot = document.getElementById('home-root');
if (homeRoot) {
  createRoot(homeRoot).render(<Home />);
}

// About page
const aboutRoot = document.getElementById('about-root');
if (aboutRoot) {
  createRoot(aboutRoot).render(<About />);
}

// Unit detail page
const unitRoot = document.getElementById('unit-root');
if (unitRoot) {
  const d = unitRoot.dataset;
  createRoot(unitRoot).render(
    <Unit
      identifier={d.identifier ?? ''}
      checkinUrl={d.checkinUrl ?? ''}
      isAuthenticated={d.isAuthenticated === 'true'}
      currentUsername={d.currentUsername ?? ''}
      loginUrl={d.loginUrl ?? '/accounts/login/'}
    />,
  );
}

// Check-in create page
const checkinCreateRoot = document.getElementById('checkin-create-root');
if (checkinCreateRoot) {
  const d = checkinCreateRoot.dataset;
  createRoot(checkinCreateRoot).render(
    <CheckinCreate identifier={d.identifier ?? ''} unitUrl={d.unitUrl ?? ''} />,
  );
}

// Check-in edit page
const checkinEditRoot = document.getElementById('checkin-edit-root');
if (checkinEditRoot) {
  const d = checkinEditRoot.dataset;
  createRoot(checkinEditRoot).render(
    <CheckinEdit
      identifier={d.identifier ?? ''}
      checkinId={parseInt(d.checkinId ?? '0', 10)}
      unitUrl={d.unitUrl ?? ''}
    />,
  );
}

// User detail page
const userDetailRoot = document.getElementById('user-detail-root');
if (userDetailRoot) {
  const d = userDetailRoot.dataset;
  createRoot(userDetailRoot).render(
    <UserDetail
      username={d.username ?? ''}
      currentUsername={d.currentUsername ?? ''}
      settingsUrl={d.settingsUrl ?? ''}
      isSuperuser={d.isSuperuser === 'true'}
      adminUrl={d.adminUrl ?? ''}
    />,
  );
}

// User form page
const userFormRoot = document.getElementById('user-form-root');
if (userFormRoot) {
  const d = userFormRoot.dataset;
  createRoot(userFormRoot).render(
    <UserForm
      updateUrl={d.updateUrl ?? ''}
      redirectUrl={d.redirectUrl ?? ''}
    />,
  );
}

// User settings page
const userSettingsRoot = document.getElementById('user-settings-root');
if (userSettingsRoot) {
  const d = userSettingsRoot.dataset;
  createRoot(userSettingsRoot).render(
    <UserSettings
      updateUrl={d.updateUrl ?? ''}
      callbackUrl={d.callbackUrl ?? ''}
    />,
  );
}

// Email confirmation page
const emailConfirmRoot = document.getElementById('email-confirm-root');
if (emailConfirmRoot) {
  const d = emailConfirmRoot.dataset;
  createRoot(emailConfirmRoot).render(
    <EmailConfirm
      verificationKey={d.verificationKey ?? ''}
      loginUrl={d.loginUrl ?? ''}
      emailUrl={d.emailUrl ?? ''}
    />,
  );
}

// Error pages (403, 404, 500)
const errorRoot = document.getElementById('error-root');
if (errorRoot) {
  const d = errorRoot.dataset;
  createRoot(errorRoot).render(
    <ErrorPage
      code={parseInt(d.code ?? '0', 10)}
      exception={d.exception || undefined}
      csrf={d.csrf === 'true'}
    />,
  );
}

// Social connections page
const socialConnectionsRoot = document.getElementById(
  'social-connections-root',
);
if (socialConnectionsRoot) {
  const d = socialConnectionsRoot.dataset;
  createRoot(socialConnectionsRoot).render(
    <SocialConnections
      loginUrl={d.loginUrl ?? ''}
      callbackUrl={d.callbackUrl ?? ''}
    />,
  );
}
