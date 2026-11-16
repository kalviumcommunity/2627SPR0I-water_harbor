import { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import useReports from '../../hooks/useReports';
import useWaterPoints from '../../hooks/useWaterPoints';
import useNotification from '../../hooks/useNotification';
import UnresolvedReportsTable from '../../components/staff/UnresolvedReportsTable';
import ResolveModal from '../../components/staff/ResolveModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { REPORT_STATUS } from '../../utils/constants';

export function StaffDashboardPage() {
  const { user } = useAuth();
  const { reports, loading, error, fetchReports, resolveReport } = useReports();
  const { rawWaterPoints, refetch: refetchWaterPoints } = useWaterPoints();
  const { notifySuccess, notifyError } = useNotification();

  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedWaterPoint, setSelectedWaterPoint] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  // Map water point id to object for quick lookup
  const waterPointsMap = useMemo(() => {
    const map = {};
    rawWaterPoints.forEach((wp) => {
      map[wp.id] = wp;
    });
    return map;
  }, [rawWaterPoints]);

  // Filter only active unresolved reports
  const unresolvedReports = useMemo(() => {
    return reports.filter((r) => r.status === REPORT_STATUS.REPORTED_UNAVAILABLE);
  }, [reports]);

  const resolvedReportsCount = useMemo(() => {
    return reports.filter((r) => r.status === REPORT_STATUS.STAFF_CONFIRMED_RESOLVED).length;
  }, [reports]);

  const handleOpenResolveModal = (report, waterPoint) => {
    setSelectedReport(report);
    setSelectedWaterPoint(waterPoint);
    setResolveModalOpen(true);
  };

  const handleCloseResolveModal = () => {
    setResolveModalOpen(false);
    setSelectedReport(null);
    setSelectedWaterPoint(null);
  };

  const handleConfirmResolution = async (reportId, resolvedBy) => {
    const res = await resolveReport(reportId, resolvedBy);
    if (res.success) {
      notifySuccess(`Report #${reportId} confirmed resolved by ${resolvedBy}. Public board updated.`);
      fetchReports();
      refetchWaterPoints();
    } else {
      notifyError(res.message);
    }
    return res;
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy-900)' }}>
            Facilities Management Dashboard
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--slate-600)', marginTop: 4 }}>
            Welcome, <strong>{user?.name || 'Facilities Officer'}</strong>. Review student reports and record confirmed resolutions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => {
              fetchReports();
              refetchWaterPoints();
            }}
            className="btn btn-secondary btn-sm"
          >
            🔄 Refresh Reports
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            UNRESOLVED ISSUES
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger-700)', marginTop: 4 }}>
            {unresolvedReports.length}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            RESOLVED BY STAFF
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-700)', marginTop: 4 }}>
            {resolvedReportsCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            REGISTERED WATER POINTS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: 4 }}>
            {rawWaterPoints.length}
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: 12 }}>
          Active Unresolved Reports ({unresolvedReports.length})
        </h2>

        {loading ? (
          <LoadingSpinner message="Loading facilities reports..." />
        ) : (
          <UnresolvedReportsTable
            reports={unresolvedReports}
            waterPointsMap={waterPointsMap}
            onResolveClick={handleOpenResolveModal}
          />
        )}
      </div>

      <ResolveModal
        isOpen={resolveModalOpen}
        report={selectedReport}
        waterPoint={selectedWaterPoint}
        onClose={handleCloseResolveModal}
        onConfirm={handleConfirmResolution}
      />
    </div>
  );
}

export default StaffDashboardPage;
