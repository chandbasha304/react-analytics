import React from 'react';
import ReactDOM from 'react-dom';
import reactToWebComponent from 'react-to-webcomponent';

function Dashboard() {
  return (
    <div>
      <h2>Analytics Dashboard</h2>
      <p>React-powered analytics view.</p>
    </div>
  );
}

// Convert to Web Component
const DashboardElement = reactToWebComponent(Dashboard, React, ReactDOM);
customElements.define('analytics-dashboard', DashboardElement);

export default Dashboard;
