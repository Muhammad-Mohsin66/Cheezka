# Admin Dashboard - Quick Reference

**File**: `client/src/pages/AdminDashboard.jsx`  
**Route**: `/admin/dashboard`  
**Access**: Admin role only  

---

## 🚀 Quick Start

### 1. Import Component
```javascript
import AdminDashboard from '../pages/AdminDashboard';
```

### 2. Add Route
```javascript
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

### 3. Access Dashboard
```
URL: http://localhost:3000/admin/dashboard
Login: Use admin account
```

---

## 📊 Component Overview

```
AdminDashboard Component
├── Header Section
│   ├── Title: "Admin Dashboard"
│   ├── Subtitle: User greeting
│   └── Refresh Button: Manual refresh
│
├── Summary Cards Grid (6 Cards)
│   ├── Total Revenue (💰)
│   ├── Total Orders (📦)
│   ├── Total Refunds (↩️)
│   ├── Active Customers (👥)
│   ├── Low Stock Items (⚠️)
│   └── Out of Stock (🛑)
│
└── Charts Section (4 Cards)
    ├── Revenue Line Chart
    ├── Products Bar Chart
    ├── Payment Pie Chart
    └── Detailed Metrics Table
```

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/reports/dashboard` | GET | Summary metrics | Dashboard KPIs |
| `/api/reports/revenue?type=monthly` | GET | Revenue trend | Monthly data points |
| `/api/reports/most-selling` | GET | Top products | Sales rankings |
| `/api/reports/payment-breakdown` | GET | Payment methods | Method distribution |

---

## 📈 Summary Cards

| Card | Icon | Value Source | Format |
|------|------|--------------|--------|
| Revenue | 💰 | `dashboardData.totalRevenue` | USD |
| Orders | 📦 | `dashboardData.totalOrders` | Count |
| Refunds | ↩️ | `dashboardData.totalRefunds` | USD |
| Customers | 👥 | `dashboardData.totalCustomers` | Count |
| Low Stock | ⚠️ | `dashboardData.lowStockCount` | Alert |
| Out of Stock | 🛑 | `dashboardData.outOfStockCount` | Alert |

---

## 📊 Charts Reference

### Line Chart (Revenue Trend)
```javascript
// Data structure
[
  { month: "January", revenue: 15000 },
  { month: "February", revenue: 18500 }
]

// Features
- X-Axis: Month names
- Y-Axis: Revenue amounts
- Color: #FF6B35 (orange)
- Interactive tooltip
- Animated dots
```

### Bar Chart (Top Products)
```javascript
// Data structure
[
  { name: "Pizza", salesCount: 245 },
  { name: "Salad", salesCount: 198 }
]

// Features
- X-Axis: Product names (angled)
- Y-Axis: Units sold
- Color: #FFC107 (yellow)
- Rounded corners
```

### Pie Chart (Payment Methods)
```javascript
// Data structure
[
  { name: "Credit Card", amount: 8500 },
  { name: "Debit Card", amount: 5200 }
]

// Features
- 6 color palette
- Percentage labels
- Custom legend
- Animated entrance
```

---

## 🎨 Colors & Styling

### Theme Colors
```
Primary Orange:    #FF6B35
Dark Black:        #1A1A1A
Cream White:       #F5F5F0
Light Gray:        #E8E8E3
```

### Chart Colors
```
Primary:           #FF6B35
Secondary:         #FFC107
Success:           #2ECC71
Info:              #3498DB
Danger:            #E74C3C
Warning:           #9B59B6
```

---

## 🔄 State Management

```javascript
// Data States
dashboardData        // KPI metrics
revenueData         // Chart data (array)
topProducts         // Product sales (array)
paymentData         // Payment methods (array)

// UI States
loading             // Initial loading
error               // Error message
refreshing          // Manual refresh state
```

---

## 🔧 Key Functions

### Fetch All Data
```javascript
fetchAllData()
// Fetches all 4 APIs in parallel
// Updates all state variables
// Handles errors gracefully
```

### Refresh Handler
```javascript
handleRefresh()
// Manually trigger data fetch
// Sets refreshing state
// Disables button during fetch
```

### Error Handler
```javascript
catch (err) {
  setError('Failed to load dashboard data...');
  setLoading(false);
}
```

---

## 📱 Responsive Breakpoints

```
Desktop  (1200px+)  → 3-column cards, 2-column charts
Tablet   (768px)    → 2-column cards, 1-column charts
Mobile   (480px)    → 1-column cards, full-width charts
```

---

## ⚠️ Error States

### Network Error
```
Shows: "Failed to load dashboard data..."
Button: "Try Again"
Action: Retry fetch request
```

### Empty Data
```
Chart: "No data available"
Cards: Display 0 or default values
Status: UI remains functional
```

---

## 🎯 Common Customizations

### Add Auto-Refresh
```javascript
useEffect(() => {
  const interval = setInterval(fetchAllData, 300000); // 5 min
  return () => clearInterval(interval);
}, []);
```

### Change Chart Colors
```javascript
const COLORS = ['#FF6B35', '#FFC107', '#2ECC71']; // Update array
```

### Add Date Filter
```javascript
const [dateRange, setDateRange] = useState('monthly');
api.get(`/api/reports/revenue?type=${dateRange}`);
```

### Export Dashboard
```javascript
const exportPDF = () => {
  // Add html2pdf library
  // Export current view as PDF
};
```

---

## 🧪 Testing

### Test Cases

```javascript
// ✅ Component renders
render(<AdminDashboard />);
expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

// ✅ Data fetches on mount
useEffect(() => { fetchAllData(); }, []);
expect(api.get).toHaveBeenCalledTimes(4);

// ✅ Charts render with data
expect(screen.getByText('Revenue Trend')).toBeInTheDocument();

// ✅ Error handling
const error = await waitFor(() => screen.getByText(/Failed to load/));
expect(error).toBeInTheDocument();

// ✅ Refresh button works
fireEvent.click(screen.getByText('🔄 Refresh'));
expect(api.get).toHaveBeenCalledTimes(8); // 4 more calls
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Spinner keeps spinning | Check API URLs, verify token valid |
| Empty charts | Verify backend is returning data |
| Layout broken | Clear cache, hard refresh |
| Charts not responsive | Check ResponsiveContainer props |
| Wrong colors | Verify COLORS array updated |
| Mobile not working | Check viewport meta tag |

---

## 📦 Dependencies

```json
{
  "react": "^18.0.0",
  "recharts": "^2.10.0",
  "axios": "^1.6.0"
}
```

### Install Recharts
```bash
cd client
npm install recharts
```

---

## 🎯 Data Flow Diagram

```
Component Mount
    ↓
useEffect Hook
    ↓
fetchAllData()
    ├─ api.get('/api/reports/dashboard')
    ├─ api.get('/api/reports/revenue')
    ├─ api.get('/api/reports/most-selling')
    └─ api.get('/api/reports/payment-breakdown')
    ↓
Process Responses
    ├─ setDashboardData(dashRes.data.data)
    ├─ setRevenueData(revRes.data.data)
    ├─ setTopProducts(productsRes.data.data)
    └─ setPaymentData(paymentRes.data.data)
    ↓
setLoading(false)
    ↓
Render Components
    ├─ Header + Refresh Button
    ├─ 6 Summary Cards
    └─ 4 Charts
```

---

## 💡 Pro Tips

1. **Performance**: Uses Promise.all for parallel requests
2. **Error Handling**: Try/catch with user-friendly messages
3. **Responsive**: Works on mobile, tablet, desktop
4. **Accessible**: Semantic HTML, clear labels
5. **Maintainable**: Well-organized code, clear comments

---

## 🔐 Security

✅ Role-based access (admin only)  
✅ JWT token auto-attached  
✅ 401 redirects to login  
✅ XSS protection (no eval)  
✅ CORS headers checked  

---

## 📞 Support Resources

- **Full Guide**: See `ADMIN_DASHBOARD_GUIDE.md`
- **Phase 8 APIs**: See `PHASE8_SETUP_GUIDE.md`
- **Frontend Setup**: See `PHASE9_SETUP_GUIDE.md`
- **Issue**: Check browser console for errors
- **Help**: Review API response in Network tab

---

## ✨ Features Summary

✅ 6 Summary cards with KPIs  
✅ 3 Interactive Recharts  
✅ Error handling & retry  
✅ Loading states  
✅ Refresh button  
✅ Mobile responsive  
✅ Dark mode ready  
✅ Accessible design  

---

**Last Updated**: May 17, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
