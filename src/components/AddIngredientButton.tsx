import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddIngredientButtonProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  className?: string;
}

export function AddIngredientButton({ quantity, onQuantityChange, className = '' }: AddIngredientButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-collapse after 2 seconds of inactivity
  useEffect(() => {
    if (isExpanded && quantity > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isExpanded, quantity]);

  // Reset expanded state when quantity becomes 0
  useEffect(() => {
    if (quantity === 0) {
      setIsExpanded(false);
    }
  }, [quantity]);

  const handleIncrement = () => {
    if (quantity === 0) {
      setIsExpanded(true);
    }
    onQuantityChange(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleRemove = () => {
    onQuantityChange(0);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    if (quantity > 0) {
      setIsExpanded(true);
    }
  };

  // Default state: not added yet
  if (quantity === 0) {
    return (
      <motion.button
        onClick={handleIncrement}
        className={`w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-md ${className}`}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-5 h-5 text-white" />
      </motion.button>
    );
  }

  // Collapsed state with quantity
  if (!isExpanded) {
    return (
      <motion.button
        onClick={handleExpand}
        className={`w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-md ${className}`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-white">{quantity}</span>
      </motion.button>
    );
  }

  // Expanded state
  return (
    <motion.div
      className={`flex items-center gap-2 bg-white rounded-full shadow-lg border border-gray-200 p-1 ${className}`}
      initial={{ width: 40 }}
      animate={{ width: 'auto' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Left button: Trash (quantity = 1) or Minus (quantity > 1) */}
      <motion.button
        onClick={quantity === 1 ? handleRemove : handleDecrement}
        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {quantity === 1 ? (
            <motion.div
              key="trash"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </motion.div>
          ) : (
            <motion.div
              key="minus"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Minus className="w-4 h-4 text-gray-700" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Quantity display */}
      <motion.span
        className="min-w-[24px] text-center text-gray-900"
        key={quantity}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        {quantity}
      </motion.span>

      {/* Plus button */}
      <motion.button
        onClick={handleIncrement}
        className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
        whileTap={{ scale: 0.9 }}
      >
        <Plus className="w-4 h-4 text-white" />
      </motion.button>
    </motion.div>
  );
}
