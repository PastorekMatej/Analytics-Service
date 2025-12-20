import React from 'react';
import AppSidebar from './AppSidebar';

const AppLayout = ({ children, userEmail, userRole, onLogout }) => {
  const isAuthenticated = !!userEmail;
  
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {isAuthenticated && (
        <AppSidebar userEmail={userEmail} userRole={userRole} onLogout={onLogout} />
      )}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
