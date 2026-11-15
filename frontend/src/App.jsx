import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import SOSModal from './components/SOSModal';

// Pages
import Login from './pages/Login';
import ElderlyDashboard from './pages/ElderlyDashboard';
import MedicationManagement from './pages/MedicationManagement';
import PrescriptionUpload from './pages/PrescriptionUpload';
import AIAssistant from './pages/AIAssistant';
import CaregiverDashboard from './pages/CaregiverDashboard';
import HealthRecords from './pages/HealthRecords';
import EmergencyContacts from './pages/EmergencyContacts';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { isAuthenticated, role, elderlyId, loading } = useAuth();
  
  // Default tab based on role
  const [activeTab, setActiveTab] = useState(role === 'caregiver' ? 'caregiver' : 'dashboard');
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  // Keep activeTab aligned when role switches
  React.useEffect(() => {
    if (role === 'caregiver') {
      setActiveTab('caregiver');
    } else {
      setActiveTab('dashboard');
    }
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-appBg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ElderlyDashboard
            onOpenSOS={() => setIsSOSOpen(true)}
            onNavigateToAssistant={() => setActiveTab('assistant')}
          />
        );
      case 'caregiver':
        return <CaregiverDashboard />;
      case 'medications':
        return <MedicationManagement />;
      case 'prescriptions':
        return <PrescriptionUpload />;
      case 'assistant':
        return <AIAssistant />;
      case 'health':
        return <HealthRecords />;
      case 'contacts':
        return <EmergencyContacts onOpenSOS={() => setIsSOSOpen(true)} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return role === 'caregiver' ? <CaregiverDashboard /> : <ElderlyDashboard onOpenSOS={() => setIsSOSOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-appBg text-textMain flex flex-col font-sans transition-colors duration-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSOS={() => setIsSOSOpen(true)}
      />

      <main className="flex-1 pb-16">
        {renderActiveView()}
      </main>

      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        elderlyId={elderlyId}
      />
    </div>
  );
}
