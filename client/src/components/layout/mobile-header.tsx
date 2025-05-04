import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import MobileMenu from './mobile-menu';
import NavDropdown from './nav-dropdown';

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  
  return (
    <>
      <header className="lg:hidden bg-white shadow-sm py-4 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-white mr-2">
            <Icon name="logo" className="text-white" size="lg" />
          </div>
          <h1 className="text-lg font-semibold font-poppins text-primary">PantryPal</h1>
        </div>
        <div className="flex items-center space-x-2">
          <NavDropdown 
            trigger={
              <button 
                className="flex items-center px-3 py-1.5 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg border border-neutral-200"
                aria-label="Navigation dropdown"
              >
                <span className="text-sm mr-1">Pages</span>
                <Icon name="menu" size="sm" />
              </button>
            } 
          />
          <button 
            className="p-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-full"
            onClick={toggleMenu}
            aria-label="Open menu"
          >
            <Icon name="menu" size="md" />
          </button>
        </div>
      </header>
      
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
