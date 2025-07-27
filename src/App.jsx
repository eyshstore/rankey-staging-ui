// App.jsx
import { useState, useEffect } from 'react';

import LoginPage from './LoginPage';
import Dashboard from './Dashboard';

import config from './config';

import useRequest from '../hooks/useRequest.hook';

function App() {
  const authRequest = useRequest();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authRequest.request(`${config.apiBaseUrl}/auth/check`);
        setIsLoggedIn(true);
      } catch (error) {

      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  if (authRequest.loading || checkingAuth) {
    return <div className="w-full h-full flex items-center justify-center text-white">Loading...</div>;
  }

  return isLoggedIn ? (
    <Dashboard setIsLoggedIn={setIsLoggedIn} />
  ) : (
    <LoginPage setIsLoggedIn={setIsLoggedIn} />
  );
}

export default App;