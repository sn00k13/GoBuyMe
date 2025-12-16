import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import logger from './logger';

// Haversine formula to calculate distance between two lat/lon points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
	const R = 6371; // Radius of the Earth in kilometers
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) *
			Math.cos(lat2 * (Math.PI / 180)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c; // Distance in kilometers
	return distance;
};

const geocodeAddress = async (address) => {
    const app = getApp();
    const functions = getFunctions(app, 'us-central1');
	const geocode = httpsCallable(functions, 'geocodeAddress');

    // Format the address string if it's an object
    let addressString = '';
    if (typeof address === 'object' && address !== null) {
        addressString = `${address.street || ''}, ${address.city || ''}, ${address.state || ''}, ${address.country || ''}`.trim();
    } else {
        addressString = address;
    }

    if (!addressString || addressString === ', , ,') {
        logger.error('Geocoding error: Address is empty or invalid. Raw address object was:', address);
        return null;
    }

	try {
		const result = await geocode({ address: addressString });
		const data = result.data;
		if (data && data.lat && data.lng) {
			return { latitude: data.lat, longitude: data.lng };
		} else {
            logger.error('Geocoding failed. No coordinates returned from function.', data);
			return null;
		}
	} catch (error) {
		logger.error('Error calling geocodeAddress function:', error);
		
		// Log more details about the error
		if (error.code) {
			logger.error('Error code:', error.code);
		}
		if (error.message) {
			logger.error('Error message:', error.message);
		}
		if (error.details) {
			logger.error('Error details:', error.details);
		}
		
		// Return null to allow the app to continue with a default delivery fee
		return null;
	}
};

export { calculateDistance, geocodeAddress };
