import { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import config from './config';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/auth/check`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.isAuthenticated) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="w-full h-full flex items-center justify-center text-white">Loading...</div>;
  }

  if (isLoggedIn) {
    return <Dashboard setIsLoggedIn={setIsLoggedIn} />;
  }

  return <LoginPage setIsLoggedIn={setIsLoggedIn} />;
}

export default App;