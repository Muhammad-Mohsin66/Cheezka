import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const orderData = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    if (paymentMethod === 'card') {
      if (!formData.cardName || !formData.cardNumber || !formData.cardExpiry || !formData.cardCVC) {
        setError('Please fill in all card details');
        return;
      }
    }

    try {
      setLoading(true);
      
      // Create order
      const orderPayload = {
        items: orderData.cart || [],
        deliveryType: orderData.deliveryType || 'delivery',
        deliveryAddress: orderData.address || '',
        specialInstructions: orderData.notes || '',
        total: orderData.total || 0,
        paymentMethod,
        customerDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      };

      const response = await api.post('/orders', orderPayload);
      
      // Show success and redirect
      alert('✓ Order placed successfully! Order ID: ' + response.data.data._id);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Order placement failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>💳 Checkout</h1>
        <p>Complete your payment to confirm your order</p>
      </div>

      <div className="checkout-layout">
        {/* Payment Form */}
        <div className="payment-section">
          <form onSubmit={handleSubmit} className="checkout-form">
            {error && <div className="error-message">{error}</div>}

            {/* Customer Details */}
            <div className="form-section">
              <h2>Billing Details</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="3001234567"
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-section">
              <h2>Payment Method</h2>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💳 Credit/Debit Card</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💵 Cash on Delivery</span>
                </label>
              </div>
            </div>

            {/* Card Details */}
            {paymentMethod === 'card' && (
              <div className="form-section">
                <h2>Card Information</h2>
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    className="form-input"
                    maxLength="19"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      className="form-input"
                      maxLength="5"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVC</label>
                    <input
                      type="text"
                      name="cardCVC"
                      value={formData.cardCVC}
                      onChange={handleChange}
                      placeholder="123"
                      className="form-input"
                      maxLength="4"
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-place-order">
              {loading ? '🔄 Processing...' : '✓ Place Order'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="summary-section">
          <div className="order-summary-box">
            <h2>Order Summary</h2>

            {/* Items */}
            {orderData.cart && orderData.cart.length > 0 && (
              <div className="summary-items">
                <h3>Items</h3>
                {orderData.cart.map((item, idx) => (
                  <div key={idx} className="summary-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₨ {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Delivery Info */}
            <div className="summary-info">
              <div className="info-row">
                <span>Delivery Type:</span>
                <span>{orderData.deliveryType === 'delivery' ? '📦 Delivery' : '🏪 Pickup'}</span>
              </div>
              {orderData.deliveryType === 'delivery' && (
                <div className="info-row">
                  <span>Address:</span>
                  <span className="address-text">{orderData.address}</span>
                </div>
              )}
              {orderData.notes && (
                <div className="info-row">
                  <span>Special Notes:</span>
                  <span className="notes-text">{orderData.notes}</span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="summary-breakdown">
              <div className="breakdown-row">
                <span>Subtotal</span>
                <span>₨ {orderData.subtotal || orderData.total * 0.95}</span>
              </div>
              {orderData.deliveryType === 'delivery' && (
                <div className="breakdown-row">
                  <span>Delivery Fee</span>
                  <span>₨ 100</span>
                </div>
              )}
              <div className="breakdown-row">
                <span>Tax (5%)</span>
                <span>₨ {Math.round((orderData.total * 0.95) * 0.05)}</span>
              </div>
              <div className="breakdown-row total">
                <span>Total Amount</span>
                <span>₨ {orderData.total || 0}</span>
              </div>
            </div>

            {/* Security Info */}
            <div className="security-info">
              <p>🔒 Your payment information is secure and encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
