import React, { createContext, useContext, useState } from 'react';

const StoreCartContext = createContext();

export const StoreCartProvider = ({ children }) => {
  // { [storeId]: [cartItems] }
  const [storeCarts, setStoreCarts] = useState({});

  // Get cart for a store
  const getCart = (storeId) => storeCarts[storeId] || [];

  // Add or update items in cart
  const updateCart = (storeId, newItems) => {
    setStoreCarts(prev => {
      const currentCart = prev[storeId] || [];
      
      // Create a map of existing items by name for quick lookup
      const existingItemsMap = {};
      currentCart.forEach(item => {
        existingItemsMap[item.name] = item;
      });

      // Update quantities for existing items and add new items
      newItems.forEach(newItem => {
        if (existingItemsMap[newItem.name]) {
          existingItemsMap[newItem.name].quantity = newItem.quantity;
        } else {
          existingItemsMap[newItem.name] = newItem;
        }
      });

      // Convert back to array and filter out items with quantity 0
      const updatedCart = Object.values(existingItemsMap)
        .filter(item => parseInt(item.quantity, 10) > 0);

      return {
        ...prev,
        [storeId]: updatedCart
      };
    });
  };

  // Remove item by index
  const removeFromCart = (storeId, index) => {
    setStoreCarts(prev => {
      const prevCart = prev[storeId] || [];
      const newCart = prevCart.filter((_, i) => i !== index);
      return { ...prev, [storeId]: newCart };
    });
  };

  // Clear cart for a store
  const clearCart = (storeId) => {
    setStoreCarts(prev => {
      const newCarts = { ...prev };
      delete newCarts[storeId];
      return newCarts;
    });
  };

  return (
    <StoreCartContext.Provider value={{ getCart, updateCart, removeFromCart, clearCart }}>
      {children}
    </StoreCartContext.Provider>
  );
};

export const useStoreCart = () => useContext(StoreCartContext);