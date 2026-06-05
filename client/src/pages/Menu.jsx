import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/Menu.css';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all categories
        const categoriesRes = await api.get('/categories');
        const allCategories = categoriesRes.data.data || [];
        setCategories(allCategories);
        
        // Set first category as default
        if (allCategories.length > 0) {
          setSelectedCategory(allCategories[0]._id);
        }

        // Fetch all products
        const productsRes = await api.get('/products');
        setProducts(productsRes.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="menu-container">
      {/* Header */}
      <div className="menu-header">
        <h1>🍕 Cheezka Menu</h1>
        <p>Choose from our wide variety of delicious options</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="menu-content">
        {/* Categories Sidebar */}
        <aside className="categories-sidebar">
          <h3>Categories</h3>
          <button
            className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All Products
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              className={`category-btn ${selectedCategory === category._id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category._id)}
            >
              {category.name}
            </button>
          ))}
        </aside>

        {/* Products Grid */}
        <main className="products-main">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div key={product._id} className="menu-product-card">
                  <div className="product-image-container">
                    <div className="product-image-placeholder">🍔</div>
                    {product.discount && (
                      <div className="discount-badge">{product.discount}% OFF</div>
                    )}
                  </div>
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p className="description">{product.description}</p>
                    <div className="product-meta">
                      <span className="category-tag">{product.categoryName || 'Food'}</span>
                      {product.isVegetarian && <span className="veg-tag">🥬 Veg</span>}
                      {product.isSpicy && <span className="spicy-tag">🌶️ Spicy</span>}
                    </div>
                    <div className="product-footer">
                      <div className="price-section">
                        <span className="price">₨ {product.basePrice}</span>
                        {product.discountedPrice && (
                          <span className="original-price">₨ {product.discountedPrice}</span>
                        )}
                      </div>
                      <button className="btn-add-to-cart">Add to Cart</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products">
              <p>No products found matching your search.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Menu;
