"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BurgerMenu from "@/components/burgerMenu";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/direct-url", label: "Direct URL" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [burgerOpen, setBurgerOpen] = useState(false);

  return (
    <>
      <BurgerMenu
        isOpen={burgerOpen}
        onClick={() => setBurgerOpen((open) => !open)}
        className="fixed left-5 top-5 z-50"
      />

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          burgerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setBurgerOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col gap-2 border-r-2 border-white bg-gray-700 px-4 pt-20 shadow-2xl transition-transform duration-300 ease-out ${
          burgerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setBurgerOpen(false)}
              className={`block w-full rounded border px-4 py-3 text-left text-white transition ${
                isActive
                  ? "border-white bg-white/10"
                  : "border-transparent hover:border-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </aside>

      {children}
    </>
  );
}