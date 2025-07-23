import React, { createContext, useContext, useState } from 'react';
import { SafeAreaView } from 'react-native';

const StoreCartContext = createContext();

export const StoreCartProvider = ({ children }) => {
	// { [storeId]: [cartItems] }
	const [storeCarts, setStoreCarts] = useState({});

	// Get cart for a store
	const getCart = (storeId) => storeCarts[storeId] || [];

	// Add or update items in cart
	const updateCart = (storeId, newItems) => {
		setStoreCarts((prev) => {
			const currentCart = prev[storeId] || [];

			// Create a map of existing items by id for quick lookup
			const existingItemsMap = {};
			currentCart.forEach((item) => {
				if (!item.id) {
					item.id = `${item.name}-${
						item.size || ''
					}-${Date.now()}-${Math.random()}`;
				}
				existingItemsMap[item.id] = item;
			});

			// Update quantities for existing items and add new items
			newItems.forEach((newItem) => {
				// Ensure every new item has a unique id
				if (!newItem.id) {
					newItem.id = `${newItem.name}-${
						newItem.size || ''
					}-${Date.now()}-${Math.random()}`;
				}
				if (existingItemsMap[newItem.id]) {
					existingItemsMap[newItem.id].quantity = newItem.quantity;
				} else {
					// Always store quantity as a number
newItem.quantity = Number(newItem.quantity);
existingItemsMap[newItem.id] = newItem;
				}
			});

			// Convert back to array and filter out items with quantity 0
			const updatedCart = Object.values(existingItemsMap).filter(
				(item) => parseInt(item.quantity, 10) > 0
			);

			return {
				...prev,
				[storeId]: updatedCart,
			};
		});
	};

	// Remove item by index
	const removeFromCart = (storeId, index) => {
		setStoreCarts((prev) => {
			const prevCart = prev[storeId] || [];
			const newCart = prevCart.filter((_, i) => i !== index);
			return { ...prev, [storeId]: newCart };
		});
	};

	// Clear cart for a store
	const clearCart = (storeId) => {
		setStoreCarts((prev) => {
			const newCarts = { ...prev };
			delete newCarts[storeId];
			return newCarts;
		});
	};

	// New: Update quantity for a cart item
	const updateCartItemQuantity = (restaurantId, itemId, newQuantity) => {
		if (!restaurantId || !itemId) return;
		setStoreCarts((prevCarts) => {
			const cart = prevCarts[restaurantId];
			if (!cart) return prevCarts;
			const updatedItems = cart.map((item) =>
				item.id === itemId
					? { ...item, quantity: Math.max(1, Number(newQuantity)) }
					: item
			).filter((item) => item.quantity > 0);
			return {
				...prevCarts,
				[restaurantId]: updatedItems,
			};
		});
	};

	const addToCart = (storeId, product) => {
	if (!storeId || !product) return;
	setStoreCarts((prev) => {
		const currentCart = prev[storeId] || [];
		const exists = currentCart.find((item) => item.id === product.id);
		if (exists) {
			return {
				...prev,
				[storeId]: currentCart.map((item) =>
					item.id === product.id
						? { ...item, quantity: item.quantity + 1 }
						: item
				),
			};
		} else {
			return {
				...prev,
				[storeId]: [...currentCart, { ...product, quantity: 1 }],
			};
		}
	});
};

	return (
		<StoreCartContext.Provider
			value={{
				getCart,
				updateCart,
				removeFromCart,
				clearCart,
				updateCartItemQuantity,
				addToCart,
			}}
		>
			<SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
		</StoreCartContext.Provider>
	);
};

export const useStoreCart = () => useContext(StoreCartContext);
