import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import DeviceFrame from './components/DeviceFrame';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceFrame>
      <App />
    </DeviceFrame>
  </StrictMode>,
);
