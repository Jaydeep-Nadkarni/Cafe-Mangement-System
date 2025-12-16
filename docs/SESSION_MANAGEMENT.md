# Table Session Management System

## Overview
This system manages persistent table sessions across the customer's entire ordering journey. Once a customer scans a QR code, their table information is stored locally and persists until midnight or until they scan a new QR code.

## How It Works

### 1. QR Code Scanning
- Customer scans QR code → URL: `http://localhost:3000/menu?branch=TLK001&table=7`
- MenuPage detects URL parameters
- Session is saved to localStorage with:
  - `branchCode`: Branch identifier (e.g., "TLK001")
  - `tableNumber`: Table number (e.g., "7")
  - `savedAt`: ISO timestamp
  - `expiresAt`: Midnight of the same day

### 2. Session Persistence
- Customer can navigate between pages:
  - Menu → Games → Back to Menu
  - Menu → Order Summary → Payment
  - Menu → AI Chat → Back to Menu
- Session remains active across all pages
- Each page displays a banner showing: "🎯 Table 7 at Branch TLK001"

### 3. Automatic Expiration
- Session automatically expires at midnight (00:00)
- After expiration, customer must scan a new QR code
- Expired sessions are automatically cleared

### 4. Manual Override
- Scanning a new QR code replaces the current session
- Old session data is cleared immediately

## File Structure

```
client/src/
├── utils/
│   └── sessionStorage.js          # Session management utilities
├── pages/
│   ├── MenuPage.jsx               # Displays session banner & orders
│   ├── GamesPage.jsx              # Displays session banner
│   ├── OrderSummaryPage.jsx       # Uses session for orders
│   └── PaymentSuccessPage.jsx     # Uses session data
└── components/
    └── QRCodeGenerator.jsx        # Generates QR codes in admin panel
```

## API Reference

### `saveTableSession(branchCode, tableNumber)`
Saves a new table session.
```javascript
import { saveTableSession } from '../utils/sessionStorage';

saveTableSession('TLK001', '7');
```

### `getTableSession()`
Returns the current session if valid, null if expired.
```javascript
import { getTableSession } from '../utils/sessionStorage';

const session = getTableSession();
if (session) {
  console.log(session.branchCode, session.tableNumber);
}
```

### `hasValidSession()`
Check if a valid session exists.
```javascript
import { hasValidSession } from '../utils/sessionStorage';

if (hasValidSession()) {
  console.log('Customer has scanned a QR code');
}
```

### `clearTableSession()`
Manually clear the session.
```javascript
import { clearTableSession } from '../utils/sessionStorage';

clearTableSession(); // Clear on logout or when needed
```

### `getSessionDisplayString()`
Get a formatted string for display.
```javascript
import { getSessionDisplayString } from '../utils/sessionStorage';

const display = getSessionDisplayString(); // "Table 7 at Branch TLK001"
```

### `getTimeUntilExpiration()`
Get milliseconds until session expires.
```javascript
import { getTimeUntilExpiration } from '../utils/sessionStorage';

const timeLeft = getTimeUntilExpiration();
if (timeLeft < 3600000) { // Less than 1 hour
  console.log('Session expiring soon');
}
```

## Usage Examples

### Example 1: Checking Session on Page Load
```javascript
import { getTableSession } from '../utils/sessionStorage';

export default function MyPage() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const currentSession = getTableSession();
    setSession(currentSession);
  }, []);

  return (
    <div>
      {session && <p>Ordering for Table {session.tableNumber}</p>}
    </div>
  );
}
```

### Example 2: Showing Session Banner
```javascript
import { getSessionDisplayString } from '../utils/sessionStorage';

export default function MyPage() {
  const sessionString = getSessionDisplayString();

  if (sessionString) {
    return (
      <div className="banner">
        🎯 {sessionString}
      </div>
    );
  }
}
```

### Example 3: Using Session in API Call
```javascript
import { getTableSession } from '../utils/sessionStorage';
import axios from 'axios';

const createOrder = async () => {
  const session = getTableSession();
  if (!session) {
    alert('Please scan a QR code first');
    return;
  }

  // Create order with session info
  await axios.post('/api/orders', {
    branchCode: session.branchCode,
    tableNumber: session.tableNumber,
    items: cartItems
  });
};
```

## Data Storage

### localStorage Key
- **Key**: `cafe_session`
- **Format**: JSON object
- **Persists**: Until manually cleared or expires at midnight
- **Size**: ~100 bytes per session

### Example Data
```json
{
  "branchCode": "TLK001",
  "tableNumber": "7",
  "savedAt": "2025-12-15T18:30:45.123Z",
  "expiresAt": 1765749600000
}
```

## Expiration Logic

1. **Automatic Check**: Every time `getTableSession()` is called, it checks:
   ```javascript
   if (now > session.expiresAt) {
     clearTableSession();
     return null;
   }
   ```

2. **Current Time**: Uses `new Date().getTime()` (milliseconds)

3. **Midnight Calculation**: Next day at 00:00:00
   ```javascript
   const tomorrow = new Date(now);
   tomorrow.setDate(tomorrow.getDate() + 1);
   tomorrow.setHours(0, 0, 0, 0);
   return tomorrow.getTime();
   ```

## Browser Compatibility
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard `localStorage` API
- No external dependencies required

## Testing

### Test QR Code Scanning
1. Go to Admin Dashboard → QR Codes
2. Generate QR for Table 7 at Branch TLK001
3. Scan QR on mobile → Session saves
4. Navigate to Games → Banner shows
5. Back to Menu → Banner still shows
6. Refresh page → Session persists
7. Wait until midnight → Session clears

### Test Manual Expiration
```javascript
// In browser console
localStorage.removeItem('cafe_session');
// Session is cleared
```

## Security Notes
- Data is stored in localStorage (client-side only)
- Table information is public (user can see it)
- For sensitive operations, always verify on server-side
- Session data doesn't contain authentication tokens

## Future Enhancements
- Add session duration limit (e.g., max 4 hours)
- Add session timeout with warning
- Add ability to change table mid-session
- Add server-side session verification
- Add analytics on table usage patterns
