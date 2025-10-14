import React, { useState } from 'react';
import { Navbar } from '../../organisms/Navbar/Navbar';
import { Sidebar } from '../../organisms/Sidebar/Sidebar';
import { MainContainer } from '../../organisms/MainContainer/MainContainer';

export function Layout({ children, activeMenuItem = 'dashboard' }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sempre aberto por padrão

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-light-bg dark:bg-dark-bg">
      {/* Sidebar - Sempre visível em desktop */}
      <div className={`${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
          activeItem={activeMenuItem}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar onSidebarToggle={handleSidebarToggle} />

        {/* Main Container */}
        <MainContainer>
          {children}
        </MainContainer>
      </div>
    </div>
  );
}