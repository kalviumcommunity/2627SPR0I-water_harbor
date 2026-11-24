import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import DirectoryPage from './pages/DirectoryPage';
import ReportPage from './pages/ReportPage';
import StaffDashboard from './pages/StaffDashboard';
import NotFoundPage from './pages/NotFoundPage';

function AppContent() {
  const { toast, hideToast } = useApp();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F3F6FC] text-[#102454]">
      <div>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<DirectoryPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      <Footer />

      {/* Global Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
