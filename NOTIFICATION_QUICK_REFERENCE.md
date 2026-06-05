# Notification System - Quick Reference

## 📋 Component Import & Usage

### NotificationBell (Header)
```jsx
import NotificationBell from '@/components/NotificationBell';

// Already integrated in Header.jsx
// Shows only for authenticated users
// Automatically handles polling & state
```

### NotificationsPage (Full Page)
```jsx
// Already integrated in routes
// Access: /notifications (protected route)
<Link to="/notifications">View All Notifications</Link>
```

## 🔧 Notification Service

```jsx
import notificationService from '@/services/notificationService';

// Get notifications with pagination
const data = await notificationService.getNotifications(page, limit);

// Mark single notification as read
await notificationService.markAsRead(notificationId);

// Mark all as read
await notificationService.markAllAsRead();

// Get unread count
const unread = notificationService.getUnreadCount(notifications);

// Format time
const time = notificationService.formatTimeAgo(dateString);
// Returns: "5m ago", "2h ago", "3d ago", etc.
```

## 🎯 Expected Notification Format

```javascript
{
  _id: "507f1f77bcf86cd799439011",        // Unique ID
  title: "Order Confirmed",                // Notification title
  message: "Your order #123 is confirmed", // Main message
  read: false,                             // Read status
  type: "order",                           // Type: order|delivery|payment|system|alert
  createdAt: "2024-05-17T10:30:00Z",      // ISO timestamp
  userId: "507f191e810c19729de860ea"      // User ID (backend)
}
```

## 🔌 Backend API Endpoints Required

```bash
# Fetch notifications
GET /api/notifications?page=1&limit=20
Response: { notifications: [...], total: 50 }

# Mark single notification as read
PUT /api/notifications/:id/read
Response: { success: true, notification: {...} }

# Mark all notifications as read
PUT /api/notifications/read-all
Response: { success: true }
```

## ⚙️ Configuration Options

### Polling Interval
**File**: `components/NotificationBell.jsx` (line ~30)
```javascript
pollIntervalRef.current = setInterval(() => {
  fetchNotifications();
}, 30000); // Change in milliseconds (30000 = 30 seconds)
```

### Dropdown Width
**File**: `components/NotificationBell.css` (line ~38)
```css
.notification-dropdown {
  width: 380px; /* Adjust width */
}
```

### Items Per Page
**File**: `pages/NotificationsPage.jsx` (line ~30)
```javascript
const PAGE_SIZE = 20; // Change number of items per page
```

### Max Notifications in Dropdown
**File**: `services/notificationService.js` (line ~15)
```javascript
const data = await notificationService.getNotifications(1, 10); // Change 10
```

## 🎨 Customization

### Change Primary Color
Update all occurrences of `#0066cc` in:
- `components/NotificationBell.css`
- `pages/NotificationsPage.css`

Or use CSS variables:
```css
:root {
  --primary-color: #0066cc;
  --success-color: #28a745;
  --danger-color: #dc3545;
}
```

### Change Animations
- Bell ring: `components/NotificationBell.css` → `@keyframes gentle-ring`
- Badge pulse: `@keyframes pulse-badge`
- Dropdown slide: `@keyframes slideDown`

## 📊 State Management

### NotificationBell State
```javascript
const [notifications, setNotifications] = useState([]);  // List
const [isOpen, setIsOpen] = useState(false);             // Dropdown
const [isLoading, setIsLoading] = useState(false);       // Loading
const [error, setError] = useState(null);                // Errors
```

### NotificationsPage State
```javascript
const [notifications, setNotifications] = useState([]);  // List
const [currentPage, setCurrentPage] = useState(1);       // Pagination
const [totalPages, setTotalPages] = useState(1);         // Pagination
const [filterStatus, setFilterStatus] = useState('all'); // Filter
const [isLoading, setIsLoading] = useState(false);       // Loading
const [error, setError] = useState(null);                // Errors
```

## 🔐 Authentication

Automatically handled by axios interceptor in `services/api.js`:
```javascript
// All requests automatically include:
headers: {
  'Authorization': `Bearer ${token}`
}
```

## 🚨 Error Handling

### Automatic Retry
```javascript
// Error message displays with retry button
// User clicks "Retry" to try fetching again
const handleRetry = () => {
  fetchNotifications();
};
```

### Error Types
- Network errors: Display message + retry button
- 401 Unauthorized: Redirect to login
- 500 Server error: Display message + retry button

## 📱 Responsive Breakpoints

```css
/* Desktop: 1200px+ */
/* Tablet: 768px - 1199px */
/* Mobile: 480px - 767px */
/* Small: < 480px */

/* Dropdown adjusts width automatically */
/* Cards stack on mobile */
/* Filters become full-width */
```

## 🧩 Component Hierarchy

```
Header.jsx
├── NotificationBell.jsx
│   ├── API: getNotifications()
│   ├── API: markAsRead()
│   ├── API: markAllAsRead()
│   └── UI: Dropdown Panel

Routes
├── /notifications → MainLayout
│   └── NotificationsPage.jsx
│       ├── API: getNotifications()
│       ├── API: markAsRead()
│       ├── API: markAllAsRead()
│       └── UI: Full Page View
```

## 🧪 Quick Test Checklist

```
[ ] Bell icon shows in header when logged in
[ ] Bell icon hides when logged out
[ ] Unread badge shows correct count
[ ] Dropdown opens/closes on click
[ ] Click outside closes dropdown
[ ] Mark as read removes from unread
[ ] Mark all as read clears badge
[ ] Notifications page loads
[ ] Filters work (All/Unread/Read)
[ ] Pagination works
[ ] Loading spinner shows
[ ] Error message + retry shows on failure
[ ] Empty state shows when no notifications
[ ] Responsive on mobile
[ ] Animations are smooth
[ ] 30-second polling works
```

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Bell not showing | Check `isAuthenticated` in Header |
| Notifications not loading | Verify API endpoint URL |
| Badge not updating | Check API response format |
| Dropdown not opening | Check z-index CSS property |
| Animations not smooth | Clear browser cache |
| Polling not working | Check browser console for errors |

## 📂 File Structure

```
client/src/
├── components/
│   ├── NotificationBell.jsx (220 lines)
│   └── NotificationBell.css (450 lines)
├── pages/
│   ├── NotificationsPage.jsx (220 lines)
│   └── NotificationsPage.css (500 lines)
├── services/
│   └── notificationService.js (90 lines)
└── routes/
    └── index.jsx (updated)
```

## 🚀 Deployment Checklist

- [ ] Backend API endpoints tested
- [ ] Notification format verified
- [ ] Token authentication working
- [ ] CORS configured correctly
- [ ] Error handling tested
- [ ] Mobile responsiveness verified
- [ ] Performance tested
- [ ] Animations smooth on target devices
- [ ] Documentation reviewed
- [ ] Code reviewed for security

## 📚 Related Documentation

- `NOTIFICATION_SYSTEM.md` - Detailed system documentation
- `NOTIFICATION_SETUP.md` - Setup and integration guide
- `NOTIFICATION_IMPLEMENTATION.md` - Implementation summary

## 💡 Tips & Tricks

### Custom Sound on New Notification
```javascript
const playSound = () => {
  const audio = new Audio('/sounds/notification.mp3');
  audio.play();
};
```

### Desktop Push Notifications
```javascript
if (Notification.permission === 'granted') {
  new Notification('New Message', {
    body: notification.message
  });
}
```

### Custom Notification Handler
```javascript
const handleNewNotification = (notification) => {
  // Custom logic here
  playSound();
  showDesktopNotification();
  updateBadge();
};
```

### Add Loading Skeleton
```jsx
{isLoading && !notifications.length && (
  <NotificationSkeleton count={5} />
)}
```

## 🔗 API Service Pattern

```javascript
// Simple pattern to extend service
notificationService.dismissNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error dismissing notification:', error);
    throw error;
  }
};
```

---

**Version**: 1.0  
**Last Updated**: May 17, 2026  
**Status**: Production Ready
