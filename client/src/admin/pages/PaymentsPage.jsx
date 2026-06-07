import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, Spinner } from '../components/AdminUI';

const METHOD_MAP = {
  cash:          { label: 'Cash',    bg: '#dcfce7', color: '#16a34a' },
  card:          { label: 'Card',    bg: '#e0f2fe', color: '#0369a1' },
  bank_transfer: { label: 'Bank',    bg: '#ede9fe', color: '#7c3aed' },
  online:        { label: 'Online',  bg: '#fce7f3', color: '#be185d' },
};

const STATUS_MAP = {
  pending:   { label: 'Pending',   bg: '#fef3c7', color: '#b45309' },
  completed: { label: 'Completed', bg: '#dcfce7', color: '#16a34a' },
  failed:    { label: 'Failed',    bg: '#fee2e2', color: '#dc2626' },
  refunded:  { label: 'Refunded',  bg: '#e0f2fe', color: '#0369a1' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewModal, setViewModal] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/admin/all');
      setPayments(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = payments.filter((p) =>
    p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p._id?.includes(search)
  );

  const totalRevenue = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

  const columns = [
    { key: '_id', label: 'Payment ID', render: (v) => `#${v.slice(-8).toUpperCase()}` },
    { key: 'customer', label: 'Customer', render: (v, row) => row.customer?.name || row.user?.name || '—' },
    { key: 'amount', label: 'Amount', render: (v) => <span style={{ color: '#FF6B35', fontWeight: 700 }}>Rs. {v?.toFixed(0) || 0}</span> },
    { key: 'paymentMethod', label: 'Method', render: (v) => <Badge status={v} map={METHOD_MAP} /> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} map={STATUS_MAP} /> },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Payments" subtitle="View all payment transactions and their statuses"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="💳" label="Total Payments" value={payments.length} />
        <StatsCard icon="💰" label="Total Revenue" value={`Rs. ${totalRevenue.toFixed(0)}`} />
        <StatsCard icon="✅" label="Completed" value={payments.filter((p) => p.status === 'completed').length} color="#16a34a" />
        <StatsCard icon="⏳" label="Pending" value={payments.filter((p) => p.status === 'pending').length} color="#b45309" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by customer or ID…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[{ label: 'View', icon: '👁️', onClick: (p) => setViewModal(p) }]}
            emptyMessage="No payments found"
          />
        )}
      </Card>

      <Modal isOpen={!!viewModal} title="Payment Details" onClose={() => setViewModal(null)}
        footer={<Btn variant="ghost" onClick={() => setViewModal(null)}>Close</Btn>}
      >
        {viewModal && (
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {[
              ['Payment ID', `#${viewModal._id?.slice(-8).toUpperCase()}`],
              ['Customer', viewModal.customer?.name || '—'],
              ['Amount', `Rs. ${viewModal.amount?.toFixed(0)}`],
              ['Method', viewModal.paymentMethod],
              ['Status', viewModal.status],
              ['Transaction Ref', viewModal.transactionId || '—'],
              ['Date', new Date(viewModal.createdAt).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '8px 0' }}>
                <span style={{ color: '#888', minWidth: 120 }}>{k}</span>
                <span style={{ fontWeight: 600, color: '#222' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
