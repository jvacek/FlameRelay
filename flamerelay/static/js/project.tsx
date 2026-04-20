import '../css/project.css';

import { createRoot } from 'react-dom/client';
import App from './App';

const appRoot = document.getElementById('app-root');
if (appRoot) {
  createRoot(appRoot).render(<App />);
}
