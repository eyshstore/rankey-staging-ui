import { useState, useEffect } from 'react';

import LoginPage from './LoginPage';
import Dashboard from './Dashboard';

import config from './config';

import useRequest from '../hooks/useRequest.hook';

function App() {
  const loginRequest = useRequest();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await loginRequest.request(`${config.apiBaseUrl}/auth/check`);
        if (response.isAuthenticated) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth check failed: ', error);
      }
    };
    checkAuth();
  }, []);

  if (loginRequest.loading) {
    return <div className="w-full h-full flex items-center justify-center text-white">Loading...</div>;
  }

  if (isLoggedIn) {
    return <Dashboard setIsLoggedIn={setIsLoggedIn} />;
  }

  return <LoginPage setIsLoggedIn={setIsLoggedIn} />;
}

export default App;