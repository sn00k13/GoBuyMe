// CartContext.js
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
	const [restaurantCarts, setRestaurantCarts] = useState({});

	const addToCart = (restaurantId, meal, selectedExtras, selectedProteins) => {
		setRestaurantCarts((prevCarts) => {
			const cart = prevCarts[restaurantId] || { total: 0, items: [] };

			// Create a new cart item
			const newItem = {
				id: meal.id,
				name: meal.name,
				price: meal.price,
				extras: selectedExtras.map((key) => ({
					id: key,
					name: extras[key].name,
					price: extras[key].price,
				})),
				proteins: selectedProteins.map((key) => ({
					id: key,
					name: protein[key].name,
					price: protein[key].price,
				})),
			};

			// Calculate the total price for the new item
			const itemTotal =
				newItem.price +
				newItem.extras.reduce((total, extra) => total + extra.price, 0) +
				newItem.proteins.reduce((total, protein) => total + protein.price, 0);

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
		const restaurantCart = restaurantCarts[restaurantId]?.items || []; // Use restaurantCarts
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
