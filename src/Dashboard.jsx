import React from 'react';

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen min-w-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white">
        <span className="text-xl font-bold">Rankey</span>
        <button>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c...Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
        <button className="bg-red">
            Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Nav */}
        <div className="w-1/6 border-r border-white">
          <div className="bg-indigo-500 p-2">Category scans</div>
          <div className="p-2">Product scans</div>
        </div>

        {/* Middle */}
        <div className="w-1/2 p-4 border-r border-white">
          <div></div>
        </div>

        {/* Right */}
        <div className="w-1/2 p-4 border-r border-white">
        <div></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
