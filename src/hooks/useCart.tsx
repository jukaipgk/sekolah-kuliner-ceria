
import { useState, useEffect } from 'react';
import type { Tables } from "@/integrations/supabase/types";

type MenuItem = Tables<"menu_items"> & {
  menu_categories: { name: string };
};

type CartItem = {
  menu_item: MenuItem;
  quantity: number;
};

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menu_item.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menu_item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menu_item: menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menu_item.id === menuItemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item =>
          item.menu_item.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.menu_item.id !== menuItemId);
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getCartItemQuantity = (menuItemId: string) => {
    return cart.find(item => item.menu_item.id === menuItemId)?.quantity || 0;
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.menu_item.price * item.quantity), 0);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    getCartItemQuantity,
    getTotalItems,
    getTotalPrice
  };
};
