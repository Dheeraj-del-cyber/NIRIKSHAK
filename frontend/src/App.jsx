import React, { useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import ReconciliationPage from './pages/ReconciliationPage';
import RevenueRiskPage from './pages/RevenueRiskPage';

export default function App() {
  const [activeSection, setActiveSection] = useState('reconciliation');

  return (
    <AppLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === 'reconciliation' ? <ReconciliationPage /> : <RevenueRiskPage />}
    </AppLayout>
  );
}