import React, { useState, useEffect, useCallback } from 'react';
import api from '../../shared/services/api';
import { PageHeader, StatsCard, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Input, Select, Spinner } from '../components/AdminUI';

const TYPE_MAP = {
  savings:  { label: 'Savings',  bg: '#dcfce7', color: '#16a34a' },
  current:  { label: 'Current',  bg: '#e0f2fe', color: '#0369a1' },
  business: { label: 'Business', bg: '#ede9fe', color: '#7c3aed' },
};

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ bankName: '', accountTitle: '', accountNumber: '', accountType: 'current', openingBalance: '0' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/bank-accounts');
      setAccounts(res.data?.data || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = accounts.filter((a) =>
    a.bankName?.toLowerCase().includes(search.toLowerCase()) ||
    a.accountTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || a.openingBalance || 0), 0);

  const openCreate = () => { setForm({ bankName: '', accountTitle: '', accountNumber: '', accountType: 'current', openingBalance: '0' }); setSelected(null); setModal('create'); };
  const openEdit = (acc) => { setForm({ bankName: acc.bankName, accountTitle: acc.accountTitle, accountNumber: acc.accountNumber, accountType: acc.accountType || 'current', openingBalance: acc.openingBalance || 0 }); setSelected(acc); setModal('edit'); };

  const handleSave = async () => {
    if (!form.bankName || !form.accountTitle || !form.accountNumber) { setError('Bank name, account title, and account number are required'); return; }
    try {
      setSaving(true); setError('');
      const payload = { ...form, openingBalance: Number(form.openingBalance) };
      modal === 'create' ? await api.post('/bank-accounts', payload) : await api.put(`/bank-accounts/${selected._id}`, payload);
      setModal(null); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (acc) => { if (!window.confirm(`Remove bank account "${acc.accountTitle}"?`)) return; await api.delete(`/bank-accounts/${acc._id}`); fetchData(); };

  const columns = [
    { key: 'bankName', label: 'Bank', render: (v) => <strong>{v}</strong> },
    { key: 'accountTitle', label: 'Account Title' },
    { key: 'accountNumber', label: 'Account No.', render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { key: 'accountType', label: 'Type', render: (v) => <Badge status={v} map={TYPE_MAP} /> },
    { key: 'currentBalance', label: 'Balance', render: (v, row) => <span style={{ fontWeight: 700, color: '#FF6B35' }}>Rs. {(v || row.openingBalance || 0).toFixed(0)}</span> },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageHeader title="Bank Accounts" subtitle="Track business bank accounts and balances"
        action={<Btn onClick={openCreate}>＋ Add Account</Btn>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatsCard icon="🏦" label="Total Accounts" value={accounts.length} />
        <StatsCard icon="💰" label="Total Balance" value={`Rs. ${totalBalance.toFixed(0)}`} />
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search bank accounts…" />
        </div>
        {loading ? <Spinner /> : (
          <Table columns={columns} data={filtered}
            actions={[{ label: 'Edit', icon: '✏️', onClick: openEdit }, { label: 'Delete', icon: '🗑️', onClick: handleDelete, danger: true }]}
            emptyMessage="No bank accounts found"
          />
        )}
      </Card>

      <Modal isOpen={!!modal} title={modal === 'create' ? 'Add Bank Account' : 'Edit Bank Account'} onClose={() => { setModal(null); setError(''); }}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Account'}</Btn></>}
      >
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <FormField label="Bank Name *"><Input value={form.bankName} onChange={(v) => setForm((f) => ({ ...f, bankName: v }))} placeholder="e.g. HBL" /></FormField>
        <FormField label="Account Title *"><Input value={form.accountTitle} onChange={(v) => setForm((f) => ({ ...f, accountTitle: v }))} placeholder="Cheezka Pvt Ltd" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Account Number *"><Input value={form.accountNumber} onChange={(v) => setForm((f) => ({ ...f, accountNumber: v }))} placeholder="0000-000000000" /></FormField>
          <FormField label="Account Type">
            <Select value={form.accountType} onChange={(v) => setForm((f) => ({ ...f, accountType: v }))}>
              <option value="current">Current</option>
              <option value="savings">Savings</option>
              <option value="business">Business</option>
            </Select>
          </FormField>
          <FormField label="Opening Balance (Rs.)"><Input type="number" value={form.openingBalance} onChange={(v) => setForm((f) => ({ ...f, openingBalance: v }))} placeholder="0" /></FormField>
        </div>
      </Modal>
    </div>
  );
}
