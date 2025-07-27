import { useState } from 'react';

import useRequest from '../hooks/useRequest.hook';

import config from './config';

function LoginPage({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const loginRequest = useRequest();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginRequest.request(`${config.apiBaseUrl}/auth`, 'POST', { username, password });
      setIsLoggedIn(true);
    } catch (error) {

    }
  };

  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 shadow-md rounded-lg p-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="sm:col-span-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-200">Username</label>
            <div className="mt-2">
              <div className="flex items-center rounded-md bg-gray-700 pl-3 focus-within:outline focus-within:outline-2 focus-within:outline-indigo-500">
                <input
                  type="text"
                  id="username"
                  required
                  disabled={loginRequest.loading}
                  className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-100 placeholder:text-gray-400 bg-gray-700 focus:outline-none sm:text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200">Password</label>
            <div className="mt-2">
              <input
                type="password"
                id="password"
                required
                disabled={loginRequest.loading}
                className="block w-full rounded-md bg-gray-700 px-3 py-1.5 text-base text-gray-100 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {loginRequest.error && (
            <p className="text-red-400 text-sm">
              {loginRequest.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={loginRequest.loading}
            className={`w-full p-2 bg-indigo-700 hover:bg-indigo-900 text-white rounded-md transition ${
              loginRequest.loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loginRequest.loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;