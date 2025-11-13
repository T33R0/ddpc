"use client";

import { Button } from "./button";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { useClickOutside } from "./hooks/use-click-outside";
import { motion, AnimatePresence } from "framer-motion";

type DropdownMenuProps = {
  options: {
    label: string;
    onClick: () => void;
  }[];
  children: React.ReactNode;
  className?: string;
};

export function DropdownMenu({ options, children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const ref = useClickOutside(() => setIsOpen(false));

  return (
    <div className="relative" ref={ref}>
      <Button
        onClick={toggleDropdown}
        variant="outline"
        className={`flex items-center gap-2 bg-black/30 backdrop-blur-sm border-white/20 text-white hover:bg-black/40 hover:border-white/30 ${className || ''}`}
      >
        {children}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-48 mt-2 p-1 bg-black/80 backdrop-blur-md rounded-md shadow-lg flex flex-col gap-1"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.label}
                onClick={() => {
                  option.onClick();
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-sm text-left text-white hover:bg-white/10 rounded-md transition-colors w-full"
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
