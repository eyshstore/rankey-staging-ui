import React from 'react';

const SettingsModal = ({ isOpen, onClose }) => {
  const scrapingProviders = [

  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scraping provider settings</h2>
          <button
            className="text-white hover:text-gray-300"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="border-b border-gray-200 p-4">Name</th>
                <th className="border-b border-gray-200 p-4">Key</th>
                <th className="border-b border-gray-200 p-4">Concurrent requests</th>
                <th className="border-b border-gray-200 p-4">Requests remaining</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-indigo-500">
                <td className="border-b border-gray-200 p-4">ScrapingBee</td>
                <td className="border-b border-gray-200 p-4">
                  <input className="border border-white p-2 rounded-sm" type="text" placeholder="U6I7-78MI" />
                </td>
                <td className="border-b border-gray-200 p-4">0 / 10</td>
                <td className="border-b border-gray-200 p-4">10,245</td>
              </tr>
              <tr className="hover:bg-indigo-800">
                <td className="border-b border-gray-200 p-4">Scraping API</td>
                <td className="border-b border-gray-200 p-4">---</td>
                <td className="border-b border-gray-200 p-4">---</td>
                <td className="border-b border-gray-200 p-4">---</td>
              </tr>
              <tr className="hover:bg-indigo-800">
                <td className="border-b border-gray-200 p-4">ScrapingStack</td>
                <td className="border-b border-gray-200 p-4">---</td>
                <td className="border-b border-gray-200 p-4">---</td>
                <td className="border-b border-gray-200 p-4">----</td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
