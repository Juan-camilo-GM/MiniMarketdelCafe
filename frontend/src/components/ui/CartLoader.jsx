import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';

export const CartLoader = ({ size = "large", className = "" }) => {
  if (size === "small") {
    return (
      <FaShoppingCart 
        className={`inline-block animate-pulse ${className}`} 
      />
    );
  }
  
  return (
    <div className={`flex justify-center items-center py-4 ${className}`}>
      <div className="relative flex flex-col items-center">
        <FaShoppingCart 
          className="text-indigo-600 text-4xl sm:text-5xl animate-cart-drive" 
        />
        <div className="mt-2 text-indigo-600 font-semibold animate-pulse text-sm">
          Cargando...
        </div>
      </div>
    </div>
  );
};

export default CartLoader;
