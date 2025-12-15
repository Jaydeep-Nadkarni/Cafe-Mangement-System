/**
 * Session Storage Utility for QR Code Table Sessions
 * Stores branch code and table number with automatic expiration at midnight
 */

const SESSION_KEY = 'cafe_session';

/**
 * Get the expiration time (next midnight)
 */
const getNextMidnight = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
};

/**
 * Save session data (branch code and table number)
 * @param {string} branchCode - Branch code (e.g., TLK001)
 * @param {string|number} tableNumber - Table number (e.g., 7)
 */
export const saveTableSession = (branchCode, tableNumber) => {
  if (!branchCode || tableNumber === null || tableNumber === undefined) {
    return;
  }

  const session = {
    branchCode: branchCode.toUpperCase(),
    tableNumber: String(tableNumber),
    savedAt: new Date().toISOString(),
    expiresAt: getNextMidnight()
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  console.log('Table session saved:', session);
};

/**
 * Get current session data if it's still valid
 * @returns {object|null} Session data or null if expired
 */
export const getTableSession = () => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored);
    const now = new Date().getTime();

    // Check if session has expired
    if (session.expiresAt && now > session.expiresAt) {
      console.log('Session expired, clearing...');
      clearTableSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

/**
 * Clear the current session
 */
export const clearTableSession = () => {
  localStorage.removeItem(SESSION_KEY);
  console.log('Table session cleared');
};

/**
 * Check if a session exists and is valid
 * @returns {boolean}
 */
export const hasValidSession = () => {
  return getTableSession() !== null;
};

/**
 * Get time until session expires (in milliseconds)
 * @returns {number|null} Milliseconds until expiration, or null if no session
 */
export const getTimeUntilExpiration = () => {
  const session = getTableSession();
  if (!session) return null;

  const now = new Date().getTime();
  const timeLeft = session.expiresAt - now;
  return timeLeft > 0 ? timeLeft : null;
};

/**
 * Get formatted session display string
 * @returns {string} e.g., "Table 7 at Branch TLK001"
 */
export const getSessionDisplayString = () => {
  const session = getTableSession();
  if (!session) return null;

  return `Table ${session.tableNumber} at Branch ${session.branchCode}`;
};
