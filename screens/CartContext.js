// CartContext.js
import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
	const [cart, setCart] = useState({});

	const addToCart = (
		restaurantId,
		meal,
		selectedExtras = [],
		selectedProteins = [],
		extrasData = {},
		proteinData = {}
	) => {
		if (!restaurantId || !meal) return;

		setCart((prevCarts) => {
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
				newItem.proteins.reduce(
					(total, protein) => total + (protein.price || 0),
					0
				);

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
		return cart[restaurantId]?.total || 0;
	};

	const getCartItemCount = (restaurantId) => {
		const restaurantCart = cart[restaurantId]?.items || [];
		return restaurantCart.length;
	};

	return (
		<CartContext.Provider
			value={{
				cart,
				addToCart,
				getCartItemCount,
				getCartTotal,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export const useCart = () => useContext(CartContext);
