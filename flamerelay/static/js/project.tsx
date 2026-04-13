import '../css/project.css';

import { createRoot } from 'react-dom/client';
import Navbar from './components/Navbar';
import About from './pages/About';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Unit from './pages/Unit';
import CheckinCreate from './pages/CheckinCreate';
import CheckinEdit from './pages/CheckinEdit';
import UserDetail from './pages/UserDetail';
import UserForm from './pages/UserForm';

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
      signupUrl={d.signupUrl ?? ''}
      profileUrl={d.profileUrl ?? ''}
    />,
  );
}

// Login page
const loginRoot = document.getElementById('login-root');
if (loginRoot) {
  const d = loginRoot.dataset;
  createRoot(loginRoot).render(
    <Login
      nextUrl={d.nextUrl ?? ''}
      signupUrl={d.signupUrl ?? ''}
      forgotUrl={d.forgotUrl ?? ''}
    />,
  );
}

// Signup page
const signupRoot = document.getElementById('signup-root');
if (signupRoot) {
  createRoot(signupRoot).render(
    <Signup loginUrl={signupRoot.dataset.loginUrl ?? ''} />,
  );
}

// Home page
const homeRoot = document.getElementById('home-root');
if (homeRoot) {
  createRoot(homeRoot).render(
    <Home lookupUrl={homeRoot.dataset.lookupUrl ?? '/backend/unit/'} />,
  );
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
      updateUrl={d.updateUrl ?? ''}
      emailUrl={d.emailUrl ?? ''}
      mfaUrl={d.mfaUrl ?? ''}
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
