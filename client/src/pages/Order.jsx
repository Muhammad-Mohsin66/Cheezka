import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Order.css';

const Order = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState([
    { id: 1, name: 'Spicy Burger', price: 450, quantity: 2 },
    { id: 2, name: 'Classic Pizza', price: 700, quantity: 1 },
  ]);
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [address, setAddress] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'delivery' ? 100 : 0;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;

  const handleQuantityChange = (id, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.id !== id));
    } else {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (deliveryType === 'delivery' && !address) {
      alert('Please enter delivery address');
      return;
    }
    navigate('/checkout', {
      state: { cart, deliveryType, address, notes, total },
    });
  };

  if (cart.length === 0) {
    return (
      <div className="order-container">
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Add some delicious items to get started!</p>
          <button
            className="btn-continue-shopping"
            onClick={() => navigate('/menu')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-container">
      <div className="order-header">
        <h1>🛒 Your Order</h1>
        <p>Review and complete your order</p>
      </div>

      <div className="order-layout">
        {/* Cart Items */}
        <div className="cart-section">
          <h2>Order Items</h2>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-icon">🍔</div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">₨ {item.price}</p>
                </div>
                <div className="quantity-control">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity - 1)
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <div className="item-total">₨ {item.price * item.quantity}</div>
                <button
                  className="btn-remove"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary-section">
          {/* Delivery Type */}
          <div className="delivery-options">
            <h3>Delivery Type</h3>
            <label className="radio-option">
              <input
                type="radio"
                value="delivery"
                checked={deliveryType === 'delivery'}
                onChange={(e) => setDeliveryType(e.target.value)}
              />
              <span>📦 Delivery (₨ 100)</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="pickup"
                checked={deliveryType === 'pickup'}
                onChange={(e) => setDeliveryType(e.target.value)}
              />
              <span>🏪 Pickup (Free)</span>
            </label>
          </div>

          {/* Delivery Address */}
          {deliveryType === 'delivery' && (
            <div className="address-section">
              <label>Delivery Address</label>
              <textarea
                placeholder="Enter your delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows="3"
                className="address-input"
              />
            </div>
          )}

          {/* Special Instructions */}
          <div className="notes-section">
            <label>Special Instructions (Optional)</label>
            <textarea
              placeholder="Any special requests or allergies?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="notes-input"
            />
          </div>

          {/* Price Breakdown */}
          <div className="price-breakdown">
            <h3>Order Summary</h3>
            <div className="price-row">
              <span>Subtotal</span>
              <span>₨ {subtotal}</span>
            </div>
            {deliveryType === 'delivery' && (
              <div className="price-row">
                <span>Delivery Fee</span>
                <span>₨ {deliveryFee}</span>
              </div>
            )}
            <div className="price-row">
              <span>Tax (5%)</span>
              <span>₨ {tax}</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span>₨ {total}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button className="btn-checkout" onClick={handleCheckout}>
            Proceed to Checkout →
          </button>
          <button
            className="btn-continue"
            onClick={() => navigate('/menu')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default Order;
