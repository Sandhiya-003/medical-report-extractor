import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import UploadView from './components/UploadView';
import HomeView from './components/HomeView';
import MyReportsView from './components/MyReportsView';
import HealthHistoryView from './components/HealthHistoryView';
import SettingsView from './components/SettingsView';
import UploadModal from './components/UploadModal';
import OriginalReportModal from './components/OriginalReportModal';
import SummaryExplainerModal from './components/SummaryExplainerModal';
import { fetchReports, fetchHistoryComparison, deleteReport, syncUserWithDb, updateUserDbProfile } from './api';

export default function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medlens_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation State: When logged in, starts at 'upload' or 'home'
  const [activeTab, setActiveTab] = useState('upload');
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  // User Preferences with LocalStorage persistence
  const [textSize, setTextSizeState] = useState(() => {
    try { return localStorage.getItem('medlens_text_size') || 'medium'; } catch { return 'medium'; }
  });
  const [preferredLanguage, setPreferredLanguageState] = useState(() => {
    try { return localStorage.getItem('medlens_language') || 'English (US)'; } catch { return 'English (US)'; }
  });
  const [detailLevel, setDetailLevelState] = useState(() => {
    try { return localStorage.getItem('medlens_detail_level') || 'standard'; } catch { return 'standard'; }
  });

  const setTextSize = (size) => {
    setTextSizeState(size);
    try { localStorage.setItem('medlens_text_size', size); } catch {}
  };

  const setPreferredLanguage = (lang) => {
    setPreferredLanguageState(lang);
    try { localStorage.setItem('medlens_language', lang); } catch {}
  };

  const setDetailLevel = (level) => {
    setDetailLevelState(level);
    try { localStorage.setItem('medlens_detail_level', level); } catch {}
  };

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isOriginalReportModalOpen, setIsOriginalReportModalOpen] = useState(false);
  const [isExplainerModalOpen, setIsExplainerModalOpen] = useState(false);

  const loadInitialData = React.useCallback(async (userEmail) => {
    try {
      setLoading(true);
      const email = userEmail || user?.email;
      const [reportsData, compData] = await Promise.all([
        fetchReports(email),
        fetchHistoryComparison(email),
      ]);
      const list = reportsData || [];
      setReports(list);
      setComparisonData(compData);
      if (list.length > 0) {
        setSelectedReportId(list[0].id);
      } else {
        setSelectedReportId(null);
      }
    } catch (err) {
      console.error("Failed to load initial data for user:", err);
      setReports([]);
      setSelectedReportId(null);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      loadInitialData(user.email);
    }
  }, [user?.email, loadInitialData]);

  const handleLoginSuccess = async (userProfile) => {
    setUser(userProfile);
    setActiveTab('upload');
    // Asynchronously ensure user is registered in SQLite db and load user reports
    try {
      const dbUser = await syncUserWithDb(userProfile);
      if (dbUser && dbUser.email) {
        const merged = { ...userProfile, ...dbUser };
        localStorage.setItem('medlens_user', JSON.stringify(merged));
        setUser(merged);
      }
    } catch (e) {
      console.warn("DB user sync notice:", e);
    }
    loadInitialData(userProfile.email);
  };

  const handleLogout = () => {
    localStorage.removeItem('medlens_user');
    setUser(null);
    setReports([]);
    setSelectedReportId(null);
    setActiveTab('upload');
  };

  const handleUpdateUser = async (updatedProfile) => {
    setUser(updatedProfile);
    localStorage.setItem('medlens_user', JSON.stringify(updatedProfile));
    try {
      await updateUserDbProfile(updatedProfile);
    } catch (e) {
      console.warn("Profile update notice:", e);
    }
  };

  const handleReportAnalyzed = (newReport) => {
    setReports(prev => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
    setSelectedReportId(newReport.id);
    setActiveTab('reports');
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await deleteReport(reportId, user?.email);
    } catch (err) {
      console.warn("Delete request error or already removed:", err);
    }
    setReports(prev => {
      const updated = prev.filter(r => r.id !== reportId);
      if (selectedReportId === reportId) {
        setSelectedReportId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  // If not authenticated, show modern medical login & registration portal
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading clinical workspace...</p>
        </div>
      </div>
    );
  }

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0];
  const latestReport = reports[0];
  const recentReports = reports.slice(1);

  const textSizeClass = `text-size-${textSize}`;

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col ${textSizeClass}`}>
      {/* Top Header */}
      <Header 
        user={user}
        onLogout={handleLogout}
        onNavigateUpload={() => setActiveTab('upload')}
        onNavigateSettings={() => setActiveTab('settings')}
        labReference={activeReport?.lab_reference || "#883921-A"} 
      />

      {/* Main Layout Body */}
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user}
          onLogout={handleLogout}
        />

        {/* Primary Content Viewport */}
        <main className="flex-1 p-5 sm:p-7 md:p-9 lg:px-10 overflow-y-auto max-w-7xl">
          {activeTab === 'upload' && (
            <UploadView 
              onReportAnalyzed={handleReportAnalyzed}
              onDeleteReport={handleDeleteReport}
              onNavigateToReports={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'home' && (
            <HomeView
              latestReport={latestReport}
              recentReports={recentReports}
              onOpenUpload={() => setActiveTab('upload')}
              onDeleteReport={handleDeleteReport}
              onSelectReport={(report) => {
                setSelectedReportId(report.id);
                setActiveTab('reports');
              }}
              onNavigateToMyReports={(repId) => {
                if (repId) setSelectedReportId(repId);
                setActiveTab('reports');
              }}
            />
          )}

          {activeTab === 'reports' && (
            <MyReportsView
              report={activeReport}
              allReports={reports}
              onSelectReport={(r) => setSelectedReportId(r.id)}
              onDeleteReport={handleDeleteReport}
              onOpenOriginalReport={() => setIsOriginalReportModalOpen(true)}
              onOpenExplainer={() => setIsExplainerModalOpen(true)}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'history' && (
            <HealthHistoryView comparisonData={comparisonData} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              textSize={textSize}
              setTextSize={setTextSize}
              detailLevel={detailLevel}
              setDetailLevel={setDetailLevel}
              preferredLanguage={preferredLanguage}
              setPreferredLanguage={setPreferredLanguage}
            />
          )}
        </main>
      </div>

      {/* Upload Modal (for quick pop-up access) */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onReportAnalyzed={handleReportAnalyzed}
      />

      {/* Original OCR / Text Modal */}
      <OriginalReportModal
        isOpen={isOriginalReportModalOpen}
        onClose={() => setIsOriginalReportModalOpen(false)}
        report={activeReport}
      />

      {/* Clinical Methodology Explainer Modal */}
      <SummaryExplainerModal
        isOpen={isExplainerModalOpen}
        onClose={() => setIsExplainerModalOpen(false)}
      />
    </div>
  );
}
