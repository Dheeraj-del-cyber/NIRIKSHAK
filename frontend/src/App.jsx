import React, { useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import ReconciliationPage from './pages/ReconciliationPage';
import RevenueRiskPage from './pages/RevenueRiskPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import HiddenLeakagePage from './pages/HiddenLeakagePage';
import RecoveryEnginePage from './pages/RecoveryEnginePage';
import LeakageInsightsPage from './pages/LeakageInsightsPage';

const PAGES = {
  reconciliation: ReconciliationPage,
  'revenue-risk': RevenueRiskPage,
  'digital-twin': DigitalTwinPage,
  'hidden-leakage': HiddenLeakagePage,
  'recovery-engine': RecoveryEnginePage,
  'leakage-insights': LeakageInsightsPage,
};

export default function App() {
  const [activeSection, setActiveSection] = useState('reconciliation');
  const ActivePage = PAGES[activeSection] || ReconciliationPage;

  return (
    <AppLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      <ActivePage />
    </AppLayout>
  );
}