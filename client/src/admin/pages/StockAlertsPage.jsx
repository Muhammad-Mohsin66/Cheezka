import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, Table, Spinner } from '../components/AdminUI';

const STOCK_MAP = {
  low_stock:    { label: 'Low Stock',    bg: '#fef3c7', color: '#d97706' },
  out_of_stock: { label: 'Out of Stock', bg: '#fee2e2', color: '#dc2626' },
};

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/alerts');
      setAlerts(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const outOfStock = alerts.filter((a) => a.stockStatus === 'out_of_stock');
  const lowStock = alerts.filter((a) => a.stockStatus === 'low_stock');

  const columns = [
    { key: 'image', label: '', width: 50, render: (v) => v ? <img src={v} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>📦</span> },
    { key: 'name', label: 'Product', render: (v) => <strong>{v}</strong> },
    { key: 'category', label: 'Category', render: (v, row) => row.category?.name || '—' },
    { key: 'stockQuantity', label: 'Current Stock', render: (v, row) => <span style={{ fontWeight: 800, fontSize: 16, color: v === 0 ? '#dc2626' : '#d97706' }}>{v}</span> },
    { key: 'lowStockThreshold', label: 'Min. Required', render: (v) => v },
    { key: 'stockStatus', label: 'Alert', render: (v) => <Badge status={v} map={STOCK_MAP} /> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader
        title="⚠️ Stock Alerts"
        subtitle="Products requiring immediate restocking attention"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={fetchAlerts} size="sm">🔄 Refresh</Btn>
            <Link to="/admin/inventory"><Btn variant="secondary" size="sm">Go to Inventory →</Btn></Link>
          </div>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🚨" label="Total Alerts" value={alerts.length} color="#dc2626" />
        <StatsCard icon="🛑" label="Out of Stock" value={outOfStock.length} color="#dc2626" />
        <StatsCard icon="⚠️" label="Low Stock" value={lowStock.length} color="#d97706" />
      </div>

      {outOfStock.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>🛑 Out of Stock ({outOfStock.length})</h2>
          <Card>
            {loading ? <Spinner /> : <Table columns={columns} data={outOfStock} emptyMessage="No out-of-stock items" />}
          </Card>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#d97706', marginBottom: 12 }}>⚠️ Low Stock ({lowStock.length})</h2>
        <Card>
          {loading ? <Spinner /> : <Table columns={columns} data={lowStock} emptyMessage="No low-stock alerts — you're fully stocked! 🎉" />}
        </Card>
      </div>
    </div>
  );
}
