"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShoppingCart, Phone } from "lucide-react";
import { useCartStore } from "@/lib/store";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Laptops", href: "/laptops" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-2xl tracking-tighter text-black">
              MAXX<span className="text-zinc-500 font-light">COMPUTERS</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-sm font-medium text-zinc-600 hover:text-black transition-colors">
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/cart" className="relative p-2 text-zinc-600 hover:text-black transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <a href="https://wa.me/918317399090" target="_blank" rel="noopener noreferrer" className="bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center space-x-2 rounded-sm">
              <Phone className="w-4 h-4" />
              <span>Enquire Now</span>
            </a>
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <Link href="/cart" className="relative p-2 text-zinc-600">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-600 hover:text-black focus:outline-none p-2">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-zinc-100 shadow-xl absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="block px-3 py-4 text-base font-medium text-zinc-900 border-b border-zinc-100">
                {link.name}
              </Link>
            ))}
            <a href="https://wa.me/918317399090" target="_blank" rel="noopener noreferrer" className="mt-4 w-full bg-black text-white px-5 py-3 text-sm font-medium flex items-center justify-center space-x-2 rounded-sm">
              <Phone className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
