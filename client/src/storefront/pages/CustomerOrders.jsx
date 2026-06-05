import React, { useState, useEffect } from 'react';
import api from '../../shared/services/api';
import { useAuth } from '../../shared/context/AuthContext';
import StatusBadge from '../../shared/components/StatusBadge';
import ConfirmModal from '../../shared/components/ConfirmModal';
import OrderTimeline from '../components/OrderTimeline';
import { useToast, ToastContainer } from '../../shared/components/Toast';

const CustomerOrders = () => {
  const { user } = useAuth();
  const { toasts, removeToast, showError, showSuccess } = useToast();

  // States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my-orders/list');
      if (response.data?.data) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      showError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (orderId) => {
    setSelectedOrderId(orderId);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrderId) return;

    try {
      setCancelling(true);
      await api.patch(`/orders/${selectedOrderId}/cancel`);
      showSuccess('Order cancelled successfully');
      
      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order._id === selectedOrderId
            ? { ...order, orderStatus: 'Cancelled' }
            : order
        )
      );
      
      setCancelModalOpen(false);
      setSelectedOrderId(null);
    } catch (err) {
      console.error('Error cancelling order:', err);
      showError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelOrder = (status) => {
    return status !== 'Handover to Rider' && status !== 'Delivered' && status !== 'Cancelled';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Orders</h1>
        <p style={styles.subtitle}>View and manage your food orders</p>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>🛒</p>
          <p style={styles.emptyText}>No orders yet</p>
          <p style={styles.emptySubtext}>Start ordering to see your orders here</p>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map((order) => (
            <div key={order._id} style={styles.orderCard}>
              {/* Card Header */}
              <div
                style={styles.cardHeader}
                onClick={() => setExpandedOrderId(
                  expandedOrderId === order._id ? null : order._id
                )}
              >
                <div style={styles.headerLeft}>
                  <p style={styles.orderId}>Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p style={styles.orderDate}>
                    📅 {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={styles.headerRight}>
                  <StatusBadge type="order" status={order.orderStatus} />
                  <span style={styles.expandIcon}>
                    {expandedOrderId === order._id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Card Body (Expandable) */}
              {expandedOrderId === order._id && (
                <div style={styles.cardBody}>
                  {/* Order Timeline */}
                  <OrderTimeline currentStatus={order.orderStatus} />

                  {/* Items Section */}
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📦 Items</h3>
                    <div style={styles.itemsList}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={styles.item}>
                          <span>{item.menuItem?.name || 'Item'}</span>
                          <span style={styles.itemQuantity}>x{item.quantity}</span>
                          <span style={styles.itemPrice}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>💳 Payment Details</h3>
                    <div style={styles.details}>
                      <div style={styles.detailRow}>
                        <span>Subtotal:</span>
                        <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span>Tax:</span>
                        <span>${order.tax?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span>Delivery Fee:</span>
                        <span>${order.deliveryFee?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div style={styles.detailRowHighlight}>
                        <span>Total:</span>
                        <span>${order.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Status</h3>
                    <div style={styles.statusRow}>
                      <div>
                        <p style={styles.statusLabel}>Order Status</p>
                        <StatusBadge type="order" status={order.orderStatus} />
                      </div>
                      <div>
                        <p style={styles.statusLabel}>Payment Status</p>
                        <StatusBadge type="payment" status={order.paymentStatus} />
                      </div>
                    </div>
                  </div>

                  {/* Rider Info (if assigned) */}
                  {order.assignedRider && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>🚗 Delivery</h3>
                      <div style={styles.riderInfo}>
                        <p><strong>Rider:</strong> {order.assignedRider.name}</p>
                        <p><strong>Phone:</strong> {order.assignedRider.phone}</p>
                        <p><strong>Vehicle:</strong> {order.assignedRider.vehicle}</p>
                      </div>
                    </div>
                  )}

                  {/* Cancel Button */}
                  {canCancelOrder(order.orderStatus) && (
                    <button
                      onClick={() => handleCancelClick(order._id)}
                      style={styles.cancelButton}
                    >
                      ✕ Cancel Order
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel Order?"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Order"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModalOpen(false)}
        isLoading={cancelling}
        isDangerous={true}
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #E8E8E3',
    borderTop: '4px solid #FF6B35',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    margin: '0 0 16px 0',
  },
  emptyText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999999',
    margin: 0,
  },
  ordersList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E8E8E3',
    transition: 'all 0.3s ease',
  },
  cardHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid #E8E8E3',
    transition: 'background-color 0.2s ease',
  },
  headerLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: '0 0 4px 0',
  },
  orderDate: {
    fontSize: '12px',
    color: '#999999',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#999999',
  },
  cardBody: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1A1A1A',
    margin: 0,
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '8px',
    backgroundColor: '#F5F5F0',
    borderRadius: '6px',
  },
  itemQuantity: {
    color: '#999999',
  },
  itemPrice: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#F5F5F0',
    borderRadius: '6px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  detailRowHighlight: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '700',
    paddingTop: '8px',
    borderTop: '1px solid #E8E8E3',
    color: '#FF6B35',
  },
  statusRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#999999',
    margin: '0 0 6px 0',
  },
  riderInfo: {
    padding: '12px',
    backgroundColor: '#F5F5F0',
    borderRadius: '6px',
    fontSize: '13px',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
  },
};

// Add animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default CustomerOrders;
