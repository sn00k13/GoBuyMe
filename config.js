export const RECAPTCHA_CONFIG = {
    siteKey: '6LfzeVkrAAAAAGBvGvL8FnsrOmnozKQ24M9pD5L9', // For development - replace with production key when deploying
    baseUrl: 'http://localhost:19006', // Development URL for Expo
    enterprise: true, // Use enterprise mode for better user experience
    hideBadge: true, // Hide the reCAPTCHA badge since we're using custom UI
    theme: 'light',
    size: 'invisible', // Use invisible reCAPTCHA for better UX
}; 