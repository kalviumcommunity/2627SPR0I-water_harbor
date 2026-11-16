import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import DirectoryPage from './pages/DirectoryPage';
import ReportPage from './pages/ReportPage';
import StaffDashboard from './pages/StaffDashboard';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<DirectoryPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
          <Toast />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
