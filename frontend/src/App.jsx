import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import RequirementBuilderView from './components/RequirementBuilderView';
import ResultsView from './components/ResultsView';
import ComparisonView from './components/ComparisonView';
import DataQualityView from './components/DataQualityView';
import { fetchHealth, fetchMatchById } from './api/client';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [matchData, setMatchData] = useState(null);
  const [comparedSuppliers, setComparedSuppliers] = useState([]);
  const [serverStatus, setServerStatus] = useState('connecting');

  useEffect(() => {
    async function checkHealth() {
      try {
        await fetchHealth();
        setServerStatus('online');
      } catch (err) {
        console.error('Server offline or unreachable:', err);
        setServerStatus('offline');
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMatchSuccess = (data) => {
    setMatchData(data);
    setActiveView('results');
  };

  const loadSavedMatchRequest = async (requestId) => {
    try {
      const data = await fetchMatchById(requestId);
      setMatchData(data);
      setActiveView('results');
    } catch (err) {
      alert(`Could not load match request: ${err.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        hasResults={!!matchData}
        resultCount={matchData?.results?.length || 0}
        comparedSuppliersCount={comparedSuppliers.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Topbar
          activeView={activeView}
          setActiveView={setActiveView}
          evaluationDate={matchData?.evaluation_date}
          serverStatus={serverStatus}
          requestId={matchData?.request_id}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              setActiveView={setActiveView}
              loadMatchRequest={loadSavedMatchRequest}
            />
          )}

          {activeView === 'builder' && (
            <RequirementBuilderView
              onMatchSuccess={handleMatchSuccess}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'results' && (
            <ResultsView
              matchData={matchData}
              setActiveView={setActiveView}
              comparedSuppliers={comparedSuppliers}
              setComparedSuppliers={setComparedSuppliers}
            />
          )}

          {activeView === 'comparison' && (
            <ComparisonView
              comparedSuppliers={comparedSuppliers}
              setComparedSuppliers={setComparedSuppliers}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'data-quality' && (
            <DataQualityView />
          )}
        </main>
      </div>
    </div>
  );
}
