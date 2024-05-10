// Navbar.tsx
import React from 'react';
import NavigationLinks from './NavigationLinks';
import { useRouter } from 'next/router';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';

export const Navbar = () => {
  const router = useRouter();
  return (
    <div className="flex flex-row mx-auto w-full md:w-5/6 justify-between items-center pt-2 md:pt-4 px-4">
      <a className="btn btn-ghost text-xl" onClick={() => router.push('/')}>
        Bluewind
      </a>

      <div className="dropdown lg:hidden">
        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
          <HamburgerMenuIcon />
        </div>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
        >
          <NavigationLinks />
        </ul>
      </div>
      <div className="hidden lg:block">
        <ul className="menu menu-horizontal px-1">
          <NavigationLinks />
        </ul>
      </div>
    </div>
  );
};
