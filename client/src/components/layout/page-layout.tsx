import React from 'react';
import MobileHeader from './mobile-header';
import Sidebar from './sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
