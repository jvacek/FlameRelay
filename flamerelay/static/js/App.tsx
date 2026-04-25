import { Component } from 'react';
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import PrivateRoute from './PrivateRoute';
import Navbar from './components/Navbar';
import About from './pages/About';
import CheckinCreate from './pages/CheckinCreate';
import CheckinEdit from './pages/CheckinEdit';
import EmailConfirm from './pages/EmailConfirm';
import ErrorPage from './pages/ErrorPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SocialConnections from './pages/SocialConnections';
import Unit from './pages/Unit';
import UserDetail from './pages/UserDetail';
import UserForm from './pages/UserForm';
import UserSettings from './pages/UserSettings';

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <ErrorPage code={500} />;
    return this.props.children;
  }
}

function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <Navbar />
      <div key={pathname} className="page-enter">
        <Outlet />
      </div>
      <footer className="mt-16 border-t border-char/10 py-6 text-center text-xs text-char/50">
        <span>LitRoute</span>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about/" element={<About />} />
              <Route path="/accounts/login/" element={<Login />} />
              <Route path="/accounts/signup/" element={<Signup />} />
              <Route
                path="/accounts/confirm-email/:key"
                element={<EmailConfirm />}
              />
              <Route path="/unit/:identifier/" element={<Unit />} />
              <Route
                path="/unit/:identifier/checkin"
                element={
                  <PrivateRoute>
                    <CheckinCreate />
                  </PrivateRoute>
                }
              />
              <Route
                path="/unit/:identifier/checkin/:checkinId"
                element={
                  <PrivateRoute>
                    <CheckinEdit />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/"
                element={
                  <PrivateRoute>
                    <UserDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/update/"
                element={
                  <PrivateRoute>
                    <UserForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/settings/"
                element={
                  <PrivateRoute>
                    <UserSettings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/socialconnect/"
                element={
                  <PrivateRoute>
                    <SocialConnections />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<ErrorPage code={404} />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
