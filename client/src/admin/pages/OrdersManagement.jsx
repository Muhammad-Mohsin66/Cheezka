import React, { useState, useEffect } from 'react';
import api from '../../shared/services/api';
import StatusBadge from '../../shared/components/StatusBadge';
import ConfirmModal from '../../shared/components/ConfirmModal';
import OrderTable from '../components/OrderTable';
import { useToast, ToastContainer } from '../../shared/components/Toast';

const OrdersManagement = () => {
  const { toasts, removeToast, showError, showSuccess } = useToast();

  // States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [selectedRider, setSelectedRider] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    'Confirmed',
    'Preparing',
    'Ready',
    'Assigned to Rider',
    'Handover to Rider',
  ];

  // Fetch data on mount
  useEffect(() => {
    fetchOrders();
    fetchRiders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/admin/all');
      if (response.data?.data) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      showError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiders = async () => {
    try {
      // Get all users and filter for riders
      const response = await api.get('/auth/users');
      if (response.data?.users) {
        setRiders(response.data.users.filter((u) => u.role === 'rider'));
      }
    } catch (err) {
      console.error('Error fetching riders:', err);
    }
  };

  const handleStatusChange = (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    setSelectedOrderId(orderId);
    setNewStatus(order.orderStatus);
    setStatusModal(true);
  };

  const handleConfirmStatus = async () => {
    if (!selectedOrderId || !newStatus) return;

    try {
      setSubmitting(true);
      await api.patch(`/orders/${selectedOrderId}/status`, {
        orderStatus: newStatus,
      });
      showSuccess('Order status updated successfully');

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order._id === selectedOrderId
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );

      setStatusModal(false);
      setNewStatus('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRider = (orderId) => {
    setSelectedOrderId(orderId);
    setSelectedRider('');
    setAssignModal(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedOrderId || !selectedRider) {
      showError('Please select a rider');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/orders/${selectedOrderId}/assign-rider`, {
        riderId: selectedRider,
      });
      showSuccess('Rider assigned successfully');

      // Update local state
      const rider = riders.find((r) => r._id === selectedRider);
      setOrders((prev) =>
        prev.map((order) =>
          order._id === selectedOrderId
            ? {
                ...order,
                assignedRider: rider,
                orderStatus: 'Assigned',
              }
            : order
        )
      );

      setAssignModal(false);
      setSelectedRider('');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to assign rider');
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: '_id',
      label: 'Order ID',
      width: '120px',
      render: (value) => `#${value.slice(-8).toUpperCase()}`,
    },
    {
      key: 'customer',
      label: 'Customer',
      width: '150px',
      render: (value, row) => row.customer?.name || 'N/A',
    },
    {
      key: 'total',
      label: 'Total',
      width: '100px',
      render: (value) => `$${value?.toFixed(2) || '0.00'}`,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      width: '120px',
      render: (value) => <StatusBadge type="payment" status={value} />,
    },
    {
      key: 'orderStatus',
      label: 'Order Status',
      width: '150px',
      render: (value) => <StatusBadge type="order" status={value} />,
    },
    {
      key: 'assignedRider',
      label: 'Assigned Rider',
      width: '150px',
      render: (value) => value?.name || '—',
    },
  ];

  const actions = [
    {
      label: 'Status',
      icon: '⚙️',
      onClick: (row) => handleStatusChange(row._id),
    },
    {
      label: 'Assign',
      icon: '🚗',
      onClick: (row) => handleAssignRider(row._id),
    },
  ];

  return (
    <div style={styles.container}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Orders Management</h1>
        <p style={styles.subtitle}>Manage all orders and assign riders</p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Orders</p>
          <p style={styles.statValue}>{orders.length}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Pending</p>
          <p style={styles.statValue}>
            {orders.filter((o) => o.orderStatus === 'Pending').length}
          </p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>In Progress</p>
          <p style={styles.statValue}>
            {orders.filter(
              (o) =>
                o.orderStatus !== 'Pending' &&
                o.orderStatus !== 'Delivered'
            ).length}
          </p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Delivered</p>
          <p style={styles.statValue}>
            {orders.filter((o) => o.orderStatus === 'Delivered').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <OrderTable
          columns={columns}
          data={orders}
          actions={actions}
          isLoading={loading}
          isEmpty={orders.length === 0}
          emptyMessage="No orders found"
        />
      </div>

      {/* Status Modal */}
      <ConfirmModal
        isOpen={statusModal}
        title="Update Order Status"
        message={
          <div>
            <p>Select new status:</p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={styles.select}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        }
        confirmText="Update"
        cancelText="Cancel"
        onConfirm={handleConfirmStatus}
        onCancel={() => setStatusModal(false)}
        isLoading={submitting}
      />

      {/* Assign Rider Modal */}
      <ConfirmModal
        isOpen={assignModal}
        title="Assign Rider"
        message={
          <div>
            <p>Select a rider:</p>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              style={styles.select}
            >
              <option value="">-- Choose Rider --</option>
              {riders.map((rider) => (
                <option key={rider._id} value={rider._id}>
                  {rider.name} - {rider.phone}
                </option>
              ))}
            </select>
          </div>
        }
        confirmText="Assign"
        cancelText="Cancel"
        onConfirm={handleConfirmAssign}
        onCancel={() => setAssignModal(false)}
        isLoading={submitting}
      />
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#F5F5F0',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666666',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #E8E8E3',
  },
  statLabel: {
    fontSize: '12px',
    color: '#999999',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#FF6B35',
    margin: 0,
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #E8E8E3',
    fontSize: '13px',
    marginTop: '8px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
};

export default OrdersManagement;
