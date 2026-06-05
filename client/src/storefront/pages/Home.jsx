import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/services/api';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories
        const categoriesRes = await api.get('/categories');
        setCategories(categoriesRes.data.data || []);
        
        // Fetch featured products
        const productsRes = await api.get('/products?limit=6');
        setFeaturedProducts(productsRes.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-time">FROM 11 AM TO 12 PM</div>
            <h1 className="hero-title">BEST <span className="hero-highlight">BURGERS</span></h1>
            <p className="hero-tagline">"Cheezka: Where Every Bite Rules the Crust and the Bun."</p>
          </div>
        </div>
      </section>

      {/* Call & Delivery Section */}
      <section className="info-section">
        <div className="info-box call-box">
          <h3>📞 CALL US:</h3>
          <p className="phone">0303-2793109</p>
          <p className="phone">0303-2444109</p>
        </div>
        <div className="info-box delivery-box">
          <h3>🚚 FREE DELIVERY</h3>
          <p>Order what you want and choose pickup time</p>
          <button className="btn-secondary" onClick={() => navigate('/menu')}>
            Order Now
          </button>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="categories-section">
          <h2>Our Categories</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category._id} className="category-card" onClick={() => navigate('/menu')}>
                <div className="category-icon">🍕</div>
                <h3>{category.name}</h3>
                <p>{category.description || 'Delicious options'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {!loading && featuredProducts.length > 0 && (
        <section className="featured-section">
          <h2>Featured Products</h2>
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <div key={product._id} className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
                <div className="product-image">
                  <div className="image-placeholder">🍔</div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-footer">
                    <span className="price">₨ {product.basePrice}</span>
                    <button className="btn-add">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Order?</h2>
        <p>Browse our complete menu and place your order now</p>
        <button className="btn-primary" onClick={() => navigate('/menu')}>
          Browse Full Menu
        </button>
      </section>
    </div>
  );
};

export default Home;
