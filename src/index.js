import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Expose mount and unmount lifecycles globally for micro-frontend integration
const roots = {};

window.mountReactAnalytics = (containerId) => {
  const container = document.getElementById(containerId);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    roots[containerId] = root;
  }
};

window.unmountReactAnalytics = (containerId) => {
  if (roots[containerId]) {
    roots[containerId].unmount();
    delete roots[containerId];
  }
};

// Standalone mode: auto-mount to default 'root' element if it is present
const standaloneRoot = document.getElementById('root');
if (standaloneRoot) {
  const root = ReactDOM.createRoot(standaloneRoot);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

reportWebVitals();

