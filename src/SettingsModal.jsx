import React, { useState } from 'react';

const SettingsModal = ({ isOpen, onClose }) => {
  const [currentScrapingProvider, setCurrentScrapingProvider] = useState(-1);
  const scrapingProviders = [
    { name: "ScrapingAnt", key: "AHYU-65GH", concurrentRequestsOccupied: 5, concurrentRequestsMax: 10, requestsRemaining: 10000 },
    { name: "ScrapingBee", key: "AHYU-65GH", concurrentRequestsOccupied: 0, concurrentRequestsMax: 10, requestsRemaining: 10000 },
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
              {scrapingProviders.length ? (
                scrapingProviders.map((provider, index) => (
                  <tr
                    key={provider.name}
                    className={index === currentScrapingProvider ? "bg-indigo-500" : "hover:bg-indigo-800 hover:cursor-pointer"}
                    onClick={() => setCurrentScrapingProvider(index)}
                  >
                    <td className="border-b border-gray-200 p-4">{provider.name}</td>
                    <td className="border-b border-gray-200 p-4">
                      <input
                        className="border border-white p-2 rounded-sm"
                        type="text"
                        placeholder="API Key"
                        defaultValue={provider.key}
                      />
                    </td>
                    <td className="border-b border-gray-200 p-4">{`${provider.concurrentRequestsOccupied} / ${provider.concurrentRequestsMax}`}</td>
                    <td className="border-b border-gray-200 p-4">{provider.requestsRemaining.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border-b border-gray-200 p-4 text-center">
                    No scraping providers available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;