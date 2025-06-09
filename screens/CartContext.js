// CartContext.js
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
	const [restaurantCarts, setRestaurantCarts] = useState({});

	const addToCart = (restaurantId, meal, selectedExtras = [], selectedProteins = [], extrasData = {}, proteinData = {}) => {
		if (!restaurantId || !meal) return;

		setRestaurantCarts((prevCarts) => {
			const cart = prevCarts[restaurantId] || { total: 0, items: [] };

			// Create a new cart item
			const newItem = {
				id: meal.id,
				name: meal.name,
				price: meal.price,
				extras: Array.isArray(selectedExtras) 
					? selectedExtras.map((key) => ({
						id: key,
						name: extrasData[key]?.name || key,
						price: extrasData[key]?.price || 0,
					}))
					: [],
				proteins: Array.isArray(selectedProteins)
					? selectedProteins.map((key) => ({
						id: key,
						name: proteinData[key]?.name || key,
						price: proteinData[key]?.price || 0,
					}))
					: [],
			};

			// Calculate the total price for the new item
			const itemTotal =
				(newItem.price || 0) +
				newItem.extras.reduce((total, extra) => total + (extra.price || 0), 0) +
				newItem.proteins.reduce((total, protein) => total + (protein.price || 0), 0);

			// Add the new item to the cart
			const updatedItems = [...cart.items, newItem];
			const updatedTotal = cart.total + itemTotal;

			return {
				...prevCarts,
				[restaurantId]: { total: updatedTotal, items: updatedItems },
			};
		});
	};

	const getCartTotal = (restaurantId) => {
		return restaurantCarts[restaurantId]?.total || 0;
	};

	const getCartItemCount = (restaurantId) => {
		const restaurantCart = restaurantCarts[restaurantId]?.items || [];
		return restaurantCart.length;
	};

	return (
		<CartContext.Provider
			value={{ addToCart, getCartTotal, getCartItemCount, restaurantCarts }}
		>
			{children}
		</CartContext.Provider>
	);
};

export const useCart = () => useContext(CartContext);
