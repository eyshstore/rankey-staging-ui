import { useState } from 'react';

function LoginPage({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    const validUsername = 'admin';
    const validPassword = 'password123';

    if (username === validUsername && password === validPassword) {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen min-w-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-gray-800 shadow-md rounded-lg p-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="sm:col-span-4">
            <label htmlFor="username" className="block text-sm/6 font-medium text-gray-200">Username</label>
            <div className="mt-2">
              <div className="flex items-center rounded-md bg-gray-700 pl-3 outline-1 -outline-offset-1 outline-gray-600 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-500">
                <input
                  type="text"
                  id="username"
                  required
                  className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-100 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 bg-gray-700"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-200">Password</label>
            </div>
            <div className="mt-2">
              <input
                type="password"
                id="password"
                required
                className="block w-full rounded-md bg-gray-700 px-3 py-1.5 text-base text-gray-100 outline-1 -outline-offset-1 outline-gray-600 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-yellow-100 text-white rounded-md hover:bg-indigo-700 transition duration-50"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
