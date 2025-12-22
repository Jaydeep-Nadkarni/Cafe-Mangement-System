/**
 * Date Formatting Utilities
 * Centralized date formatting for consistent display across the application
 */

/**
 * Format date to DD-MM-YYYY
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (default: 'DD-MM-YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'DD-MM-YYYY') => {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    const formats = {
        'DD-MM-YYYY': `${day}-${month}-${year}`,
        'DD/MM/YYYY': `${day}/${month}/${year}`,
        'DD-MM-YYYY HH:mm': `${day}-${month}-${year} ${hours}:${minutes}`,
        'DD/MM/YYYY HH:mm': `${day}/${month}/${year} ${hours}:${minutes}`,
        'DD-MM-YYYY HH:mm:ss': `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`,
        'HH:mm': `${hours}:${minutes}`,
        'HH:mm:ss': `${hours}:${minutes}:${seconds}`,
    };

    return formats[format] || formats['DD-MM-YYYY'];
};

/**
 * Get time range label for chart granularity
 * @param {string} range - Time range (today, 7d, 30d, year)
 * @returns {string} Granularity (hourly, daily, monthly)
 */
export const getTimeRangeGranularity = (range) => {
    const granularityMap = {
        '15min': 'minute',
        '1h': 'minute',
        '6h': 'hourly',
        'today': 'hourly',
        '7d': 'daily',
        '30d': 'daily',
        'week': 'daily',
        'month': 'daily',
        'year': 'monthly',
        'yearly': 'monthly'
    };

    return granularityMap[range] || 'daily';
};

/**
 * Format chart label based on granularity
 * @param {Date|string} date - Date to format
 * @param {string} granularity - hourly, daily, monthly
 * @returns {string} Formatted label
 */
export const formatChartLabel = (date, granularity) => {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    switch (granularity) {
        case 'minute':
            return formatDate(d, 'HH:mm');

        case 'hourly':
            return `${String(d.getHours()).padStart(2, '0')}:00`;

        case 'daily':
            return formatDate(d, 'DD-MM-YYYY');

        case 'monthly':
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

        default:
            return formatDate(d);
    }
};

/**
 * Get date range for analytics queries
 * @param {string} range - Time range identifier
 * @returns {Object} { start: Date, end: Date }
 */
export const getDateRange = (range) => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    switch (range) {
        case '15min':
            start.setMinutes(now.getMinutes() - 15);
            break;
        case '1h':
            start.setHours(now.getHours() - 1);
            break;
        case '6h':
            start.setHours(now.getHours() - 6);
            break;
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case '7d':
        case 'week':
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            break;
        case '30d':
        case 'month':
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            break;
        case 'year':
        case 'yearly':
            start.setFullYear(now.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            break;
        default:
            start.setHours(0, 0, 0, 0);
    }

    return { start, end };
};

/**
 * Format time range display
 * @param {string} range - Time range identifier
 * @returns {string} Human-readable range
 */
export const formatTimeRangeDisplay = (range) => {
    const displays = {
        '15min': 'Last 15 Minutes',
        '1h': 'Last Hour',
        '6h': 'Last 6 Hours',
        'today': 'Today',
        '7d': 'Last 7 Days',
        'week': 'This Week',
        '30d': 'Last 30 Days',
        'month': 'This Month',
        'year': 'This Year',
        'yearly': 'Last 12 Months'
    };

    return displays[range] || 'Today';
};

/**
 * Generate hourly labels (00:00 - 23:00)
 * @returns {Array} Array of hour labels
 */
export const generateHourlyLabels = () => {
    return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
};

/**
 * Generate daily labels for a month
 * @param {number} days - Number of days
 * @returns {Array} Array of day labels
 */
export const generateDailyLabels = (days = 30) => {
    const labels = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(formatDate(date, 'DD-MM-YYYY'));
    }

    return labels;
};

/**
 * Generate monthly labels for a year
 * @returns {Array} Array of month labels
 */
export const generateMonthlyLabels = () => {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
};

/**
 * Format currency with Indian Rupee symbol
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%';
    return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseFloat(num).toLocaleString('en-IN');
};
