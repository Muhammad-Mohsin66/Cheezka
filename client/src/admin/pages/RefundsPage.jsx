import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, Spinner } from '../components/AdminUI';

const STATUS_MAP = {
  Pending:   { label: 'Pending',   bg: '#fef3c7', color: '#b45309' },
  Approved:  { label: 'Approved',  bg: '#dcfce7', color: '#16a34a' },
  Rejected:  { label: 'Rejected',  bg: '#fee2e2', color: '#dc2626' },
  Processing:{ label: 'Processing',bg: '#e0f2fe', color: '#0369a1' },
  Completed: { label: 'Completed', bg: '#dcfce7', color: '#15803d' },
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/refunds/admin/all');
      setRefunds(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = refunds.filter((r) =>
    r.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r._id?.includes(search)
  );

  const handleAction = async (refundId, action) => {
    try {
      setProcessing(true);
      await api.patch(`/refunds/${refundId}/${action}`);
      setViewModal(null);
      fetchData();
    } catch { /* silently fail */ }
    finally { setProcessing(false); }
  };

  const columns = [
    { key: '_id', label: 'Refund ID', render: (v) => `#${v.slice(-8).toUpperCase()}` },
    { key: 'customer', label: 'Customer', render: (v, row) => row.customer?.name || row.user?.name || '—' },
    { key: 'order', label: 'Order Ref', render: (v) => v ? `#${(v._id || v).toString().slice(-8).toUpperCase()}` : '—' },
    { key: 'amount', label: 'Amount', render: (v) => <span style={{ color: '#FF6B35', fontWeight: 700 }}>Rs. {v?.toFixed(0) || 0}</span> },
    { key: 'reason', label: 'Reason', render: (v) => <span style={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} map={STATUS_MAP} /> },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Refunds" subtitle="Review and process customer refund requests"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="↩️" label="Total Refunds" value={refunds.length} />
        <StatsCard icon="⏳" label="Pending" value={refunds.filter((r) => r.status === 'Pending').length} color="#b45309" />
        <StatsCard icon="✅" label="Approved" value={refunds.filter((r) => r.status === 'Approved').length} color="#16a34a" />
        <StatsCard icon="❌" label="Rejected" value={refunds.filter((r) => r.status === 'Rejected').length} color="#dc2626" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by customer or ID…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[{ label: 'View', icon: '👁️', onClick: (r) => setViewModal(r) }]}
            emptyMessage="No refunds found"
          />
        )}
      </Card>

      <Modal isOpen={!!viewModal} title="Refund Details" onClose={() => setViewModal(null)}
        footer={viewModal?.status === 'Pending' ? (
          <>
            <Btn variant="ghost" onClick={() => setViewModal(null)}>Close</Btn>
            <Btn variant="danger" onClick={() => handleAction(viewModal._id, 'reject')} disabled={processing}>❌ Reject</Btn>
            <Btn onClick={() => handleAction(viewModal._id, 'approve')} disabled={processing}>✅ Approve</Btn>
          </>
        ) : <Btn variant="ghost" onClick={() => setViewModal(null)}>Close</Btn>}
      >
        {viewModal && (
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {[
              ['Refund ID', `#${viewModal._id?.slice(-8).toUpperCase()}`],
              ['Customer', viewModal.customer?.name || viewModal.user?.name || '—'],
              ['Amount', `Rs. ${viewModal.amount?.toFixed(0)}`],
              ['Reason', viewModal.reason],
              ['Status', viewModal.status],
              ['Requested', new Date(viewModal.createdAt).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '8px 0' }}>
                <span style={{ color: '#888', minWidth: 100 }}>{k}</span>
                <span style={{ fontWeight: 600, color: '#222' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
