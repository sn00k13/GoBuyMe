// CartContext.js
import React, { createContext, useContext, useState } from 'react';
import { SafeAreaView } from 'react-native';

const CartContext = createContext();

export function CartProvider({ children }) {
	const [cart, setCart] = useState({});

	const addToCart = (restaurantId, meal) => {
		if (!restaurantId || !meal) return;

		setCart((prevCarts) => {
			const cart = prevCarts[restaurantId] || { total: 0, items: [] };

			// Create a new cart item
			const newItem = {
				id: meal.id,
				name: meal.name,
				price: meal.price,
				imageUrl: meal.imageUrl || null,
				quantity: meal.quantity || 1,
			};

			// Check if item already exists (by id)
			const existingIndex = cart.items.findIndex(
				(item) => item.id === newItem.id
			);

			let updatedItems;
			if (existingIndex > -1) {
				// If exists, increase quantity
				updatedItems = cart.items.map((item, idx) =>
					idx === existingIndex
						? { ...item, quantity: item.quantity + newItem.quantity }
						: item
				);
			} else {
				// Else, add new item
				updatedItems = [...cart.items, newItem];
			}

			// Recalculate total
			const updatedTotal = updatedItems.reduce(
				(sum, item) => sum + (item.price || 0) * (item.quantity || 1),
				0
			);

			return {
				...prevCarts,
				[restaurantId]: { total: updatedTotal, items: updatedItems },
			};
		});
	};

	const removeFromCart = (restaurantId, itemId) => {
		setCart((prevCarts) => {
			const cart = prevCarts[restaurantId];
			if (!cart) return prevCarts;
			const updatedItems = cart.items.filter((item) => item.id !== itemId);
			const updatedTotal = updatedItems.reduce(
				(sum, item) => sum + (item.price || 0) * (item.quantity || 1),
				0
			);
			return {
				...prevCarts,
				[restaurantId]: { total: updatedTotal, items: updatedItems },
			};
		});
	};

	const clearCart = (restaurantId) => {
		if (!restaurantId) return; // defensive guard
		setCart((prevCarts) => {
			const { [restaurantId]: _, ...newCarts } = prevCarts; // omit key immutably
			return newCarts;
		});
	};

	const getCartTotal = (restaurantId) => {
		return cart[restaurantId]?.total || 0;
	};

	const getCartItemCount = (restaurantId) => {
		const restaurantCart = cart[restaurantId]?.items || [];
		return restaurantCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
	};

	// New: Update quantity for a cart item
    const updateCartItemQuantity = (restaurantId, itemId, newQuantity) => {
        if (!restaurantId || !itemId) return;
        setCart((prevCarts) => {
            const cart = prevCarts[restaurantId];
            if (!cart) return prevCarts;
            const updatedItems = cart.items.map((item) =>
                item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item
            );
            const updatedTotal = updatedItems.reduce(
                (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
                0
            );
            return {
                ...prevCarts,
                [restaurantId]: { total: updatedTotal, items: updatedItems },
            };
        });
    };

	return (
		<CartContext.Provider
			value={{
				cart,
				addToCart,
				removeFromCart,
				clearCart,
				getCartItemCount,
				getCartTotal,
				updateCartItemQuantity,
			}}
		>
			<SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
		</CartContext.Provider>
	);
}

export const useCart = () => useContext(CartContext);
