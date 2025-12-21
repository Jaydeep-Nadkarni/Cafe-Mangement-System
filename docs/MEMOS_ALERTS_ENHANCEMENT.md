# Memos & Alerts Enhancement

## Overview
Enhanced Memos and Alerts components with full CRUD functionality, read/acknowledge tracking, real-time badges, and proper Role-Based Access Control (RBAC).

---

## Features Implemented

### 1. **Memos.jsx Enhancements**

#### Admin Capabilities
- **Create Memos**: Admins can create memos with title, content, and priority (low/medium/high)
- **View Read Status**: See which managers have read each memo
- **Track Acknowledgement**: Track which managers have acknowledged memos
- **Archive Memos**: Delete/archive memos to keep the list clean
- **Read Status Details**: Click on "X read" badge to see detailed read/acknowledge information

#### Manager Capabilities
- **View Memos**: See all active memos created by admins
- **Mark as Read**: Indicate they've read a memo
- **Acknowledge**: Confirm understanding and action on memo content
- **Visual Feedback**: See their current status (Read/Acknowledged) on each memo

#### Visual Design
- **Priority Color Coding**: 
  - Red for high priority
  - Yellow for medium priority
  - Green for low priority
- **Read Indicators**: Shows when managers have read or acknowledged
- **Responsive Grid**: Cards layout that adapts to screen size

---

### 2. **Alerts.jsx Enhancements**

#### Admin Capabilities
- **Create Alerts**: New button to create alerts with full customization
- **Edit Alerts**: Click pencil icon to update alert details
- **Full CRUD**: Create, Read, Update, Delete alerts
- **Track Status**: See unread count in real-time badge
- **Delete Alerts**: Permanently remove alerts from system

#### Manager/All User Capabilities
- **Mark as Read**: Mark alerts as read
- **Dismiss Alerts**: Temporarily dismiss alerts (separate from delete)
- **Filter Alerts**: 
  - Unread: Only unread, not dismissed alerts
  - Read: Only read but not dismissed
  - Dismissed: Only dismissed alerts
  - All: All alerts regardless of status
- **Visual Feedback**: Styling changes based on alert priority and read status

#### Alert Types Supported
- `system`: System-wide alerts
- `order`: Order-related alerts
- `payment`: Payment-related alerts
- `kitchen`: Kitchen/operations alerts
- `memo`: Memo-related alerts
- `task`: Task-related alerts

#### Alert Priorities
- `low`: Minor issues
- `medium`: Standard alerts
- `high`: Important alerts requiring attention
- `critical`: Urgent alerts demanding immediate action

#### Visual Design
- **Priority Indicators**: Color-coded badges (low=blue, medium=yellow, high=orange, critical=red)
- **Type Icons**: Different icons for each alert type
- **Real-time Badges**: Shows unread count prominently
- **Action Buttons**: Context-specific buttons (read, edit, dismiss, delete)
- **Filter Tabs**: Easy tab-based filtering of alerts
- **Responsive Design**: Works on all screen sizes

---

## Backend Implementation

### API Endpoints

#### Memo Endpoints
```
GET    /api/admin/memos?branch=id&status=active      - Get all memos
POST   /api/admin/memos                              - Create memo
PUT    /api/admin/memos/:id/acknowledge              - Manager acknowledges
PUT    /api/admin/memos/:id/read                     - Manager marks as read
DELETE /api/admin/memos/:id                          - Archive memo
```

#### Alert Endpoints
```
GET    /api/admin/alerts?branch=id&dismissed=false   - Get alerts with filters
POST   /api/admin/alerts                             - Create alert
PUT    /api/admin/alerts/:id/read                    - Mark as read
PUT    /api/admin/alerts/:id/dismiss                 - Dismiss alert
PUT    /api/admin/alerts/:id                         - Update alert
DELETE /api/admin/alerts/:id                         - Delete alert
```

### Database Models

#### Memo Model (`Memo.js`)
```javascript
{
  branch: ObjectId,                          // Reference to branch
  title: String,                             // Memo title
  content: String,                           // Memo content
  priority: String,                          // low|medium|high
  createdBy: ObjectId (Admin),              // Admin who created
  readByManagers: [                         // Track reads
    {
      manager: ObjectId (Admin),
      readAt: Date,
      acknowledged: Boolean,
      acknowledgedAt: Date
    }
  ],
  status: String,                            // active|archived
  expiresAt: Date,                           // Optional expiration
  timestamps: true
}
```

#### Alert Model (`Alert.js`)
```javascript
{
  branch: ObjectId,                          // Reference to branch
  type: String,                              // order|payment|system|kitchen|memo|task
  title: String,                             // Alert title
  message: String,                           // Alert message
  priority: String,                          // low|medium|high|critical
  isRead: Boolean,                           // Read status
  isDismissed: Boolean,                      // Dismissed status
  createdBy: ObjectId (Admin),              // Admin who created
  relatedId: ObjectId,                       // Link to related document
  onModel: String,                           // Model type (Order, Table, Payment, Memo)
  actionUrl: String,                         // Link for action
  readAt: Date,                              // When marked as read
  dismissedAt: Date,                         // When dismissed
  timestamps: true
}
```

---

## RBAC Implementation

### Admin Role
- **Memos**: Full CRUD (create, read, update, delete)
- **Alerts**: Full CRUD with edit capability
- **Tracking**: Can view all read/acknowledge statuses
- **Admin Button**: "New Memo" and "New Alert" buttons visible
- **Edit Capability**: Can edit alert details

### Manager Role
- **Memos**: Can read and acknowledge (no create/delete)
- **Alerts**: Can mark as read, dismiss, or delete
- **No Create**: Cannot create memos or alerts
- **Own Status**: Can only see/update their own read/acknowledge status
- **Visibility**: No admin controls visible

---

## Frontend Implementation

### State Management
- `memos`: Array of memo objects
- `alerts`: Array of alert objects
- `loading`: Loading state for async operations
- `showModal`: Modal visibility for create/edit
- `editingId`: Tracks which alert is being edited
- `filter`: Current filter for alerts
- `userRole`: Current user's role
- `userId`: Current user's ID

### Key Functions

#### Memos
- `fetchMemos()`: Get memos from backend
- `createMemo()`: Create new memo
- `acknowledgeMemo()`: Acknowledge memo
- `markMemoAsRead()`: Mark memo as read
- `deleteMemo()`: Archive memo
- `getManagerReadStatus()`: Check if manager has read memo

#### Alerts
- `fetchAlerts()`: Get alerts with filtering
- `createAlert()`: Create new alert
- `updateAlert()`: Update existing alert
- `markAsRead()`: Mark alert as read
- `dismissAlert()`: Dismiss alert
- `deleteAlert()`: Delete alert
- `startEdit()`: Prepare alert for editing
- `resetForm()`: Clear form after submit

---

## User Experience Features

### Real-time Updates
- Socket.io integration for new alerts
- Automatic UI updates when new alerts arrive
- Live badge count updates

### Filtering & Search
- Alert status filtering (Unread, Read, Dismissed, All)
- Memo status tracking
- Easy identification of unread items

### Visual Feedback
- Color-coded priorities and types
- Animated spinner during operations
- Modal dialogs for create/edit
- Confirmation prompts for destructive actions

### Responsive Design
- Mobile-friendly card layouts
- Touch-friendly button sizes
- Overflow-auto for long lists

---

## Usage Examples

### Creating a Memo (Admin)
1. Click "New Memo" button
2. Enter title, content, and select priority
3. Click "Create Memo"
4. Memo appears at top of list
5. Can see read status as managers view it

### Acknowledging a Memo (Manager)
1. Click "Acknowledge" button on memo
2. Status changes to "Acknowledged"
3. Admin can see manager's name and acknowledge time

### Creating an Alert (Admin)
1. Click "New Alert" button
2. Select type, title, priority, and message
3. Optionally add action URL
4. Click "Create Alert"
5. Alert appears in unread list

### Managing Alerts
1. Click "Mark as Read" to read
2. Click "Dismiss" to temporarily hide
3. Click "Edit" (admin only) to update details
4. Click "Delete" (admin only) to remove permanently
5. Filter by status to find specific alerts

---

## Security Considerations

1. **Authentication**: All endpoints require authentication
2. **Authorization**: Role-based checks ensure proper permissions
3. **Data Isolation**: Users can only see data for their assigned branch
4. **Admin-Only Actions**: Create/delete operations restricted to admins
5. **Audit Trail**: All actions tracked with timestamps and user IDs

---

## Future Enhancements

1. **Scheduled Memos**: Send memos at specific times
2. **Memo Templates**: Pre-defined memo templates
3. **Alert Rules**: Auto-create alerts based on conditions
4. **Email Notifications**: Send memo/alert notifications via email
5. **Read Reminders**: Reminder for unread memos
6. **Memo Expiration**: Auto-archive old memos
7. **Batch Operations**: Bulk acknowledge/read memos
8. **Search**: Full-text search for memos and alerts

---

## Testing Checklist

- [ ] Admin can create memos
- [ ] Managers can view memos
- [ ] Managers can mark memos as read
- [ ] Managers can acknowledge memos
- [ ] Admin can see read/acknowledge status
- [ ] Admin can archive memos
- [ ] Admin can create alerts
- [ ] Admin can edit alerts
- [ ] Users can mark alerts as read
- [ ] Users can dismiss alerts
- [ ] Filters work correctly
- [ ] Real-time updates work
- [ ] RBAC properly enforced
- [ ] Responsive design on mobile

---

## Files Modified

1. **Frontend**
   - `client/src/admins/components/branch/Memos.jsx` - Enhanced with read/acknowledge tracking
   - `client/src/admins/components/branch/Alerts.jsx` - Full CRUD implementation

2. **Backend**
   - `server/controllers/adminController.js` - New endpoints: `markMemoAsRead`, `updateAlert`
   - `server/routes/adminRoutes.js` - Added memo and alert routes

3. **Models** (Already existed)
   - `server/models/Memo.js` - Already had `readByManagers` field
   - `server/models/Alert.js` - Already had necessary fields

---
