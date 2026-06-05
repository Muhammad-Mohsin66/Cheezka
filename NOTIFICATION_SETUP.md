# Notification System Setup & Integration Guide

## Quick Start

The Notification System has been fully implemented and integrated into Cheezka. Here's what's been set up:

## ✅ Completed Setup

### 1. **Components Created**
```
✓ NotificationBell.jsx     - Header notification dropdown
✓ NotificationBell.css     - Modern dropdown styles
✓ NotificationsPage.jsx    - Full notifications page
✓ NotificationsPage.css    - Responsive page styles
```

### 2. **Service Layer**
```
✓ notificationService.js   - API communication & utilities
```

### 3. **Integration Points**
```
✓ Header.jsx               - NotificationBell added to header
✓ routes/index.jsx         - /notifications route configured
```

## 🚀 How It Works

### Display Notifications
1. **In Header**: Bell icon automatically shows unread badge
   - Click to open dropdown with latest notifications
   - Polls every 30 seconds for updates
   - Shows 10 latest notifications

2. **On Dedicated Page**: Navigate to `/notifications` for full view
   - 20 notifications per page
   - Filter by status (All, Unread, Read)
   - Paginated results

### User Actions
- ✓ Mark individual notification as read
- ✓ Mark all notifications as read
- ✓ View notification details (title, message, time)
- ✓ See notification type badges (order, delivery, payment, etc.)

## 📋 Backend API Requirements

Ensure your backend has these endpoints:

```
GET    /api/notifications?page=1&limit=20
Response: {
  notifications: [
    {
      _id: "id",
      title: "Title",
      message: "Message",
      read: false,
      type: "order|delivery|payment|system|alert",
      createdAt: "2024-05-17T10:30:00Z"
    }
  ],
  total: 50
}

PUT    /api/notifications/:id/read
Response: { success: true, notification: {...} }

PUT    /api/notifications/read-all
Response: { success: true }
```

## 🎨 Key Features

### NotificationBell (Header)
- 🔔 Animated bell icon with ring effect
- 🔴 Red badge showing unread count
- 📱 Responsive dropdown (380px on desktop)
- 🔄 Auto-refresh every 30 seconds
- ✨ Smooth animations and transitions
- 🌐 Works only for authenticated users

### NotificationsPage (Full Page)
- 📄 Full-width notification cards
- 🔍 Filter by status (All/Unread/Read)
- 📑 Pagination support
- 🏷️ Color-coded notification types
- ⏱️ Human-readable timestamps
- 📱 Mobile-responsive design

## 🔧 Configuration

### Polling Interval
Edit `client/src/components/NotificationBell.jsx`:
```javascript
// Currently set to 30 seconds
pollIntervalRef.current = setInterval(() => {
  fetchNotifications();
}, 30000); // Change this value (in milliseconds)
```

### Items Per Page
Edit `client/src/pages/NotificationsPage.jsx`:
```javascript
const PAGE_SIZE = 20; // Change to desired number
```

### Dropdown Width
Edit `client/src/components/NotificationBell.css`:
```css
.notification-dropdown {
  width: 380px; /* Adjust width */
}
```

## 🎯 Usage Examples

### Display in Custom Component
```jsx
import NotificationBell from '../components/NotificationBell';

export default function MyComponent() {
  return (
    <div>
      <NotificationBell />
    </div>
  );
}
```

### Link to Notifications Page
```jsx
<Link to="/notifications">
  View All Notifications
</Link>
```

### Get Notification Service
```jsx
import notificationService from '../services/notificationService';

// Fetch notifications
const data = await notificationService.getNotifications(1, 20);

// Mark as read
await notificationService.markAsRead(notificationId);

// Format time
const timeAgo = notificationService.formatTimeAgo(date);
```

## 🛡️ Authentication

- Bell only displays for authenticated users
- `/notifications` route is protected
- All API calls include Bearer token automatically

## 📱 Responsive Breakpoints

| Screen Size | Dropdown Width | Adjustments |
|------------|---|---|
| Desktop (1200px+) | 380px | Full features |
| Tablet (768px-1199px) | 380px | Optimized spacing |
| Mobile (480px-767px) | calc(100vw - 2rem) | Stacked layout |
| Small Mobile (<480px) | 100vw | Full-width dropdown |

## ⚡ Performance Optimizations

- ✅ Polling only when dropdown is open (not visible = no polling)
- ✅ Efficient re-renders using proper state updates
- ✅ GPU-accelerated animations
- ✅ Debounced click-outside detection
- ✅ Lazy-loaded components

## 🎭 Design System

### Colors
- **Primary Blue**: `#0066cc` - Main actions, unread indicators
- **Success Green**: `#28a745` - Mark as read
- **Danger Red**: `#dc3545` - Errors, alerts
- **Warning Yellow**: `#ffc107` - Warnings
- **Light Gray**: `#f8f9fa` - Backgrounds
- **Dark Text**: `#212529` - Main content

### Typography
- **Headings**: Font weight 600-700
- **Body**: Font weight 400
- **Small text**: Font size 0.875rem or less

## 🐛 Troubleshooting

### Notifications not showing
1. Check backend API endpoints are correct
2. Verify authentication token is valid
3. Check browser console for errors
4. Ensure user role allows notifications

### Badge not updating
1. Check polling is working (Network tab)
2. Verify API returns correct `read` status
3. Clear browser cache

### Dropdown not opening
1. Ensure NotificationBell is rendered
2. Check z-index CSS property
3. Verify click event is firing

### Animations not smooth
1. Check CSS animations are loaded
2. Disable hardware acceleration test
3. Check for CSS conflicts

## 📚 File Locations

```
client/
├── src/
│   ├── components/
│   │   ├── NotificationBell.jsx
│   │   └── NotificationBell.css
│   ├── pages/
│   │   ├── NotificationsPage.jsx
│   │   └── NotificationsPage.css
│   ├── services/
│   │   └── notificationService.js
│   └── routes/
│       └── index.jsx (updated)
└── Documentation:
    ├── NOTIFICATION_SYSTEM.md
    └── NOTIFICATION_SETUP.md (this file)
```

## ✨ Next Steps

1. **Test the system**:
   ```bash
   npm run dev
   # Login and check for bell icon in header
   # Click to open dropdown
   # Navigate to /notifications for full view
   ```

2. **Create test notifications** in backend:
   ```javascript
   // Example notification creation
   POST /api/notifications
   {
     userId: "user_id",
     title: "Order Placed",
     message: "Your order #123 has been placed successfully",
     type: "order"
   }
   ```

3. **Customize styling** if needed:
   - Update colors in CSS files
   - Adjust animations
   - Modify responsive breakpoints

4. **Add notification sounds** (optional):
   - Install package: `npm install use-sound`
   - Add sound file to public/sounds/
   - Update NotificationBell.jsx

5. **Enable desktop notifications** (optional):
   - Add browser push notifications
   - Request user permission on first notification

## 📞 Support

For issues:
1. Check browser DevTools console
2. Review network requests
3. Verify backend API responses
4. Check `NOTIFICATION_SYSTEM.md` for detailed docs
