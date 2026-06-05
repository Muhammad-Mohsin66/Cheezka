import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div style={containerStyle}>
        <h1>Dashboard</h1>
        {user ? (
          <div>
            <p>Welcome, {user.name}!</p>
            <p>Role: {user.role}</p>
          </div>
        ) : (
          <p>Please log in to view your dashboard.</p>
        )}
      </div>
    </MainLayout>
  );
};

const containerStyle = {
  padding: '2rem',
};

export default Dashboard;
