// utils.js - Utility functions for the SparkGen application

// Buffer to collect logs before sending
let logBuffer = [];

/**
 * Environment detection helper
 * Checks various environment variables and conditions to determine if we're in production
 */
const isProduction = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production' ||
                    typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.PROD ||
                    typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);

/**
 * Sending logs to the development server
 * Disabled to prevent connection errors - logs are handled client-side only
 * @returns {Promise} - Promise resolving when logs are sent
 */
const sendLogs = async () => {
  // Logging to remote server is disabled
  // Logs are captured client-side only via console interceptor
  return Promise.resolve();
};

/**
 * Intercept console methods to add remote logging in development
 */
const setupConsoleInterceptor = () => {
  if (typeof window === 'undefined') return; // Only run in browser
  if (isProduction) return; // Skip in production

  const originalConsoleMethods = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  const consoleMethods = Object.keys(originalConsoleMethods);

  consoleMethods.forEach((method) => {
    console[method] = (...args) => {
      // Call the original method
      originalConsoleMethods[method](...args);

      // Don't send logs in production
      if (isProduction) return;
      
      // Add to buffer
      try {
        const logEntry = {
          timestamp: new Date().toISOString(),
          level: method,
          message: args.map(arg => {
            if (typeof arg === 'object') {
              return JSON.stringify(arg);
            }
            return String(arg);
          }).join(' ')
        };
        
        logBuffer.push(logEntry);
        
        // Attempt to send logs (will only send if buffer has items)
        sendLogs().catch(error => {
          // Silently fail - we don't want to cause console loops
        });
      } catch (e) {
        // Just log the error to original console, don't disrupt app
        originalConsoleMethods.error('Error in console interceptor:', e);
      }
    };
  });
};

/**
 * Format date to localized string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * Initialize the utility functions
 */
const initUtils = () => {
  // Only setup console interceptor in development environment
  if (!isProduction) {
    setupConsoleInterceptor();
  }
};

// Export utility functions
export {
  sendLogs,
  setupConsoleInterceptor,
  formatDate,
  truncateText,
  initUtils
};

// Initialize utilities when this module is loaded
if (typeof window !== 'undefined') {
  initUtils();
}