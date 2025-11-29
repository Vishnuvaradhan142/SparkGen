/**
 * Utility functions for the Sparkgen client
 */

// Simple client-side logging to localStorage only
(function setupLogging() {
    const STORAGE_KEY = 'sparkgen_log_buffer';
    const MAX_BUFFER_SIZE = 100;
    let logBuffer = [];

    // Load existing logs from localStorage
    try {
        const storedLogs = localStorage.getItem(STORAGE_KEY);
        if (storedLogs) {
            logBuffer = JSON.parse(storedLogs);
        }
    } catch (err) {
        // Ignore storage errors
    }

    // Save logs to localStorage
    function saveToStorage() {
        if (logBuffer.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(logBuffer));
            } catch (e) {
                // Ignore if storage is full
            }
        }
    }

    // Add log to buffer
    function addLog(level, message) {
        if (logBuffer.length >= MAX_BUFFER_SIZE) {
            logBuffer.shift(); // Remove oldest
        }
        logBuffer.push({
            timestamp: new Date().toISOString(),
            level,
            message
        });
    }

    // Intercept console methods
    const consoleMethods = ['log', 'error', 'warn', 'info', 'debug'];
    const originalConsoleMethods = {};

    consoleMethods.forEach(method => {
        originalConsoleMethods[method] = console[method];
    });

    consoleMethods.forEach((method) => {
        console[method] = function (...args) {
            // Call original method first
            originalConsoleMethods[method].apply(console, args);

            // Add to buffer
            try {
                const message = args
                    .map((arg) => {
                        if (arg instanceof Error) {
                            return `${arg.name}: ${arg.message}`;
                        } else if (typeof arg === 'object' && arg !== null) {
                            try {
                                return JSON.stringify(arg);
                            } catch (e) {
                                return '[Object]';
                            }
                        } else {
                            return String(arg);
                        }
                    })
                    .join(' ');

                addLog(method, message.trim());
                saveToStorage();
            } catch (e) {
                // Silently fail
            }
        };
    });
})();

/**
 * Sleeps for the specified duration
 * @param {number} ms - Time in milliseconds
 * @returns {Promise} - Resolves after the time has passed
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Truncates text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Safely parses JSON, returning default value on error
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} - Parsed object or default value
 */
export const safeJsonParse = (jsonString, defaultValue = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Detect network connectivity changes
 * @param {Function} onOnline - Callback when online
 * @param {Function} onOffline - Callback when offline
 * @returns {Function} - Function to remove event listeners
 */
export const detectConnectivity = (onOnline, onOffline) => {
  const handleOnline = () => {
    if (typeof onOnline === 'function') onOnline();
  };

  const handleOffline = () => {
    if (typeof onOffline === 'function') onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return function to clean up listeners
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export default {
  sleep,
  truncateText,
  safeJsonParse,
  debounce,
  detectConnectivity
};