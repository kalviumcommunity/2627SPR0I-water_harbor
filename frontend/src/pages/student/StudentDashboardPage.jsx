import { useState } from 'react';
import useWaterPoints from '../../hooks/useWaterPoints';
import useReports from '../../hooks/useReports';
import useNotification from '../../hooks/useNotification';
import WaterPointFilter from '../../components/waterPoints/WaterPointFilter';
import WaterPointList from '../../components/waterPoints/WaterPointList';
import IssueReportModal from '../../components/reports/IssueReportModal';
import { APP_CONFIG } from '../../utils/constants';

export function StudentDashboardPage() {
  const {
    waterPoints,
    rawWaterPoints,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    refetch,
  } = useWaterPoints();

  const { submitReport } = useReports();
  const { notifySuccess, notifyWarning } = useNotification();

  const [selectedWaterPoint, setSelectedWaterPoint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenReportModal = (wp) => {
    setSelectedWaterPoint(wp);
    setModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setModalOpen(false);
    setSelectedWaterPoint(null);
  };

  const handleReportSubmit = async (payload) => {
    const res = await submitReport(payload);
    if (res.success) {
      notifySuccess(`Issue report submitted for ${selectedWaterPoint?.name}. Thank you!`);
      refetch(); // Refresh the directory so the new report status shows immediately
    } else if (res.isConflict) {
      notifyWarning(res.message);
    }
    return res;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy-900)' }}>
          Campus Water Points Directory
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--slate-600)', marginTop: 4 }}>
          Live community-reported availability for {APP_CONFIG.UNIVERSITY_NAME}. Find a working dispenser or report an issue.
        </p>
      </div>

      <WaterPointFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        totalCount={rawWaterPoints.length}
        filteredCount={waterPoints.length}
      />

      <WaterPointList
        waterPoints={waterPoints}
        loading={loading}
        error={error}
        onReportIssue={handleOpenReportModal}
        onRetry={refetch}
      />

      <IssueReportModal
        isOpen={modalOpen}
        waterPoint={selectedWaterPoint}
        onClose={handleCloseReportModal}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}

export default StudentDashboardPage;
