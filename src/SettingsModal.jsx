import React, { useState, useEffect } from 'react';

import config from './config';

import useRequest from "../hooks/useRequest.hook";

const SettingsModal = ({ isOpen, onClose }) => {
  const [availableScrapingProviders, setAvailableScrapingProviders] = useState([]);
  const [currentScrapingProviderName, setCurrentScrapingProviderName] = useState(null);
  const [error, setError] = useState(null);

  const scrapingProvidersRequest = useRequest();

  const fetchProviders = async () => {
    try {
      const data = await scrapingProvidersRequest.request(`${config.apiBaseUrl}/amazon/scraping-providers`);
      setAvailableScrapingProviders(data.availableScrapingProviders);
      setCurrentScrapingProviderName(data.currentScrapingProviderName);
    } catch (error) {
      
    }
  };

  const handleRenewCredits = async (event) => {
    event.stopPropagation();
    await scrapingProvidersRequest.request(`${config.apiBaseUrl}/amazon/scraping-providers/renew`, "POST");
    console.log("Credits for MockAmazonProvider successfully renewed.");
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchProviders();
  }, [isOpen]);

  const handleSelectProvider = async (providerName) => {
    try {
      await scrapingProvidersRequest.request(`${config.apiBaseUrl}/amazon/scraping-providers/select`, 'POST', { providerName });
      fetchProviders();
    } catch (error) {
      const code = error.code;
      if (code === "NO_API_KEY") {
        const apiKey = prompt(`Enter ${providerName}'s API key.`);
        if (!apiKey) {
          setError("No API key was provided.");
          return;
        }
  
        try {
          await scrapingProvidersRequest.request(`${config.apiBaseUrl}/amazon/scraping-providers/key`, 'POST', { apiKey, providerName });
        } catch (error) {
          setError(`Failed to update API key: ${error.message}`);
          return;
        }

        try {
          await scrapingProvidersRequest.request(`${config.apiBaseUrl}/amazon/scraping-providers/select`, 'POST', { providerName });
          fetchProviders();
        } catch (error) {
          setError(error);
        }
      } else {
        setError(error);
      }
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-3/4 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Scraping Provider Settings</h2>
          <button className="text-white hover:text-gray-300" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        <button className="button bg-red-500 hover:bg-red-700 text-white p-2 m-2 rounded-md shrink-0" onClick={handleRenewCredits}>
          Renew MockAmazonProvider
        </button>

        {error && (
          <div className="bg-red-500 text-white p-2 rounded-md mb-4">
            {error.message}
          </div>
        )}

        {scrapingProvidersRequest.loading ? (
          <div className="text-white text-center">Loading providers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 p-4 text-left text-white">Name</th>
                  <th className="border-b border-gray-200 p-4 text-left text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {availableScrapingProviders.length > 0 ? (
                  availableScrapingProviders.map(provider => (
                    <tr
                      key={provider.name}
                      className={
                        provider.name === currentScrapingProviderName
                          ? "bg-indigo-500"
                          : "hover:bg-indigo-800 hover:cursor-pointer"
                      }
                      onClick={() =>
                        provider.name !== currentScrapingProviderName &&
                        handleSelectProvider(provider.name)
                      }
                    >
                      <td className="border-b border-gray-200 p-4 text-white">{provider.name}</td>
                      <td className="border-b border-gray-200 p-4 text-white">
                        {provider.hasApiKey ? "Has API Key" : "No Key"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="border-b border-gray-200 p-4 text-center text-white">
                      No scraping providers available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
