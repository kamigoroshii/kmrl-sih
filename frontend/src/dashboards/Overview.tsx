// ...existing code...
import React from 'react';
import AlertsPopup from '../components/AlertsPopup'; // <-- add this import (path shown for your repo layout)
// ...existing code...

export default function Overview(): JSX.Element {
  return (
    <div className="overview-page" style={{ position: 'relative' }}>
      {/* Demo: show alerts popup under Logout. Remove forceShow after demo */}
      <AlertsPopup forceShow={true} />

      {/* ...existing header/navigation code ... */}
      {/* ...existing dashboard content ... */}
    </div>
  );
}
// ...existing code...