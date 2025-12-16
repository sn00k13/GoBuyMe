import { Alert } from 'react-native';
import logger from './logger';

class ErrorHandler {
  // Handle API errors
  handleApiError(error, context = '') {
    logger.error(`API Error ${context}:`, error);

    let userMessage = 'An error occurred. Please try again.';

    if (error.message) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        userMessage = 'Session expired. Please log in again.';
      } else if (error.message.includes('403') || error.message.includes('forbidden')) {
        userMessage = 'You do not have permission to perform this action.';
      } else if (error.message.includes('404')) {
        userMessage = 'Resource not found.';
      } else if (error.message.includes('500')) {
        userMessage = 'Server error. Please try again later.';
      }
    }

    return {
      userMessage,
      technicalError: error.message || 'Unknown error',
      shouldRetry: this.isRetryableError(error),
    };
  }

  // Check if error is retryable
  isRetryableError(error) {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableMessages = ['network', 'timeout', 'ECONNRESET', 'ETIMEDOUT'];

    if (error.status && retryableStatusCodes.includes(error.status)) {
      return true;
    }

    if (error.message) {
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg.toLowerCase())
      );
    }

    return false;
  }

  // Show user-friendly error alert
  showError(error, context = '') {
    const { userMessage } = this.handleApiError(error, context);
    Alert.alert('Error', userMessage);
  }

  // Retry logic wrapper
  async withRetry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        const { shouldRetry } = this.handleApiError(error);
        
        if (!shouldRetry || i === maxRetries - 1) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, delay * Math.pow(2, i))
        );
        
        logger.warn(`Retrying (${i + 1}/${maxRetries})...`);
      }
    }
  }
}

export default new ErrorHandler();