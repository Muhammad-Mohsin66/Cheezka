import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, Spinner } from '../components/AdminUI';

const AVAIL_MAP = {
  true:  { label: 'Available',    bg: '#dcfce7', color: '#16a34a' },
  false: { label: 'Unavailable',  bg: '#fee2e2', color: '#dc2626' },
};

export default function RidersPage() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [riderDeliveries, setRiderDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=rider&limit=200');
      setRiders(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = riders.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search)
  );

  const viewRider = async (rider) => {
    setViewModal(rider);
    setLoadingDeliveries(true);
    try {
      const res = await api.get(`/orders/admin/all?riderId=${rider._id}&limit=5`);
      setRiderDeliveries(res.data?.data || []);
    } catch { setRiderDeliveries([]); }
    finally { setLoadingDeliveries(false); }
  };

  const handleToggle = async (rider) => {
    await api.patch(`/users/${rider._id}/toggle`);
    fetchData();
  };

  const columns = [
    { key: 'name', label: 'Name', render: (v) => <strong>{v}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'isActive', label: 'Active', render: (v) => <Badge status={String(v)} map={AVAIL_MAP} /> },
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Riders" subtitle="Manage delivery riders and view their delivery history"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🏍️" label="Total Riders" value={riders.length} />
        <StatsCard icon="✅" label="Active" value={riders.filter((r) => r.isActive).length} color="#16a34a" />
        <StatsCard icon="❌" label="Inactive" value={riders.filter((r) => !r.isActive).length} color="#dc2626" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search riders…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[
              { label: 'View', icon: '👁️', onClick: viewRider },
              { label: 'Toggle', icon: '🔄', onClick: handleToggle },
            ]}
            emptyMessage="No riders found"
          />
        )}
      </Card>

      <Modal isOpen={!!viewModal} title={`Rider — ${viewModal?.name}`} onClose={() => setViewModal(null)}
        footer={<Btn variant="ghost" onClick={() => setViewModal(null)}>Close</Btn>}
      >
        {viewModal && (
          <>
            <div style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
              {[['Name', viewModal.name], ['Email', viewModal.email], ['Phone', viewModal.phone], ['Status', viewModal.isActive ? '✅ Active' : '❌ Inactive'], ['Joined', new Date(viewModal.createdAt).toLocaleString()]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '7px 0' }}>
                  <span style={{ color: '#888', minWidth: 80 }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#555' }}>Recent Deliveries</h4>
            {loadingDeliveries ? <Spinner /> : riderDeliveries.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>No deliveries yet</p>
            ) : riderDeliveries.map((o) => (
              <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span>#{o._id.slice(-8).toUpperCase()}</span>
                <span style={{ color: '#555' }}>{o.orderStatus}</span>
                <span style={{ color: '#888' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </>
        )}
      </Modal>
    </div>
  );
}
