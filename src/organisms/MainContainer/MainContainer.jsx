import React from 'react';

export function MainContainer({ children, className = '' }) {
  return (
    <main
      className={`
        flex-1 p-6 
        bg-light-bg dark:bg-dark-bg
        transition-colors duration-300
        overflow-auto
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </main>
  );
}
