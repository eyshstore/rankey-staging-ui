import { useState } from 'react';

import LoginPage from './LoginPage';
import Dashboard from './Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <Dashboard />;
  }

  return <LoginPage setIsLoggedIn={setIsLoggedIn} />;
}

export default App;