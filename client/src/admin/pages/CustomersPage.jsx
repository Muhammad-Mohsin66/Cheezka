import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, Spinner } from '../components/AdminUI';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=customer&limit=200');
      setCustomers(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const viewCustomer = async (customer) => {
    setViewModal(customer);
    setLoadingOrders(true);
    try {
      const res = await api.get(`/orders/admin/all?customerId=${customer._id}&limit=5`);
      setCustomerOrders(res.data?.data || []);
    } catch {
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (v) => <strong>{v}</strong> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'isEmailVerified', label: 'Verified', render: (v) => v ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> : <span style={{ color: '#dc2626' }}>✗</span> },
    { key: 'isActive', label: 'Status', render: (v) => (
      <span style={{ fontWeight: 600, color: v ? '#16a34a' : '#dc2626' }}>{v ? 'Active' : 'Inactive'}</span>
    )},
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Customers" subtitle="View and manage your customer base"
        action={<Btn variant="ghost" onClick={fetchData} size="sm">🔄 Refresh</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="👤" label="Total Customers" value={customers.length} />
        <StatsCard icon="✅" label="Active" value={customers.filter((c) => c.isActive).length} color="#16a34a" />
        <StatsCard icon="📧" label="Verified" value={customers.filter((c) => c.isEmailVerified).length} color="#7c3aed" />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email or phone…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[{ label: 'View', icon: '👁️', onClick: viewCustomer }]}
            emptyMessage="No customers found"
          />
        )}
      </Card>

      <Modal isOpen={!!viewModal} title={`Customer — ${viewModal?.name}`} onClose={() => setViewModal(null)}
        footer={<Btn variant="ghost" onClick={() => setViewModal(null)}>Close</Btn>}
      >
        {viewModal && (
          <>
            <div style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
              {[
                ['Name', viewModal.name],
                ['Email', viewModal.email],
                ['Phone', viewModal.phone],
                ['Joined', new Date(viewModal.createdAt).toLocaleString()],
                ['Status', viewModal.isActive ? '✅ Active' : '❌ Inactive'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '7px 0' }}>
                  <span style={{ color: '#888', minWidth: 80 }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#555' }}>Recent Orders</h4>
            {loadingOrders ? <Spinner /> : customerOrders.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>No orders yet</p>
            ) : customerOrders.slice(0, 5).map((o) => (
              <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span>#{o._id.slice(-8).toUpperCase()}</span>
                <span style={{ color: '#FF6B35', fontWeight: 700 }}>Rs. {o.total?.toFixed(0)}</span>
                <span style={{ color: '#888' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </>
        )}
      </Modal>
    </div>
  );
}
