const isDev = __DEV__;

class Logger {
  log(...args) {
    if (isDev) {
      console.log('[LOG]', ...args);
    }
  }

  error(...args) {
    // Always log errors, even in production
    console.error('[ERROR]', ...args);
    
    // In production, you might want to send to error tracking service
    if (!isDev) {
      // Send to Sentry, LogRocket, etc.
      // this.reportError(...args);
    }
  }

  warn(...args) {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  }

  info(...args) {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  }

  debug(...args) {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  }

  // Sanitize sensitive data before logging
  sanitize(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey', 'authorization'];
    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  // Log API calls with sanitization
  apiCall(endpoint, method, body = null) {
    if (isDev) {
      this.log(`API ${method} ${endpoint}`, body ? this.sanitize(body) : '');
    }
  }

  // Log API responses
  apiResponse(endpoint, status, data) {
    if (isDev) {
      this.log(`API Response ${endpoint} [${status}]`, this.sanitize(data));
    } else if (status >= 400) {
      this.error(`API Error ${endpoint} [${status}]`, this.sanitize(data));
    }
  }
}

export default new Logger();