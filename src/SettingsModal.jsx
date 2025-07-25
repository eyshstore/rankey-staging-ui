import React, { useState, useEffect } from 'react';

import config from './config';

import useRequest from "../hooks/useRequest.hook";

/*
  Algorithm:
  currentScrapingProviderName = MockAmazon

  select(scrapingProvider);

  func select(scrapingProvider) {
    if (!scrapingProvider.hasApiKey()) {
      let apiKey = prompt(`Enter API key for ${scrapingProvider.name}`);
      if (!apiKey) {
        alert("No API key was entered.");
        return;
      }

      await scrapingProvider.set(apiKey);
    }

    try {
      // const status = await scrapingProvider.updateStatus(); -> getStatus

      if (!status) {
        // 403 Error
        alert(`Failed to retrieve info about ${scrapingProvider.name}. Try later.`);
        return;
      }

      currentScrapingProviderName = scrapingProvider;
    } catch (error) {
      alert(`Failed to retrieve info about ${scrapingProvider.name}. Try later.`);
      return;
    }
  }

  <button scrapingProvider=MockAmazon onClick=select>
  <button scrapingProvider=ScrapingBee onClick=select>
  <button scrapingProvider=ScrapingAnt onClick=select>
  */

const SettingsModal = ({ isOpen, onClose }) => {
  const [providers, setProviders] = useState([]);
  const [currentScrapingProviderName, setCurrentScrapingProviderName] = useState(-1);
  const [error, setError] = useState(null);

  const scrapingProvidersRequest = useRequest();
  const selectScrapingProviderRequest = useRequest();
  const scrapingProviderKeyRequest = useRequest();

  const fetchProviders = async () => {
    const response = await scrapingProvidersRequest.request(`${config.apiBaseUrl}/amazon/scraping-providers`);
    if (scrapingProvidersRequest.error) {
      return;
    }

    setProviders(response.availableScrapingProviders);
    setCurrentScrapingProviderName(response.currentScrapingProviderName);
  };

  // Fetch providers on modal open
  useEffect(() => {
    if (!isOpen) return;
    fetchProviders();
  }, [isOpen]);

  // Handle selecting a provider
  const handleSelectProvider = async (providerName) => {
    const response = await fetch(`${config.apiBaseUrl}/amazon/select-scraping-provider`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ providerName }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      switch (error.message) {
        case "No API Key":
          const apiKey = prompt(`Enter ${providerName}'s API key.`);
          if (!apiKey) {
            alert("No API key was provided.");
            break;
          }

          await scrapingProviderKeyRequest.request(`${config.apiBaseUrl}/amazon/scraping-provider-key`, { method: "POST" }, { apiKey, providerName });
          if (scrapingProviderKeyRequest.error) {
            alert(`Failed to update scraping provider API key: ${scrapingProviderKeyRequest.error}`);
            break;
          }
          break;
        case "Failed to check status of scraping provider":
          alert("Failed to check status of scraping provider. Please, try again later.");
          break;
      }
    }

    fetchProviders();
  };

  // Handle API key update

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [scrapingProvidersRequest.error]);

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
        {error && (
          <div className="bg-red-500 text-white p-2 rounded-md mb-4">
            {error}
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
                {providers.length ? (
                  providers.map((provider) => (
                    <tr
                      key={provider.name}
                      className={provider.name === currentScrapingProviderName ? "bg-indigo-500" : "hover:bg-indigo-800 hover:cursor-pointer"}
                      onClick={provider.name === currentScrapingProviderName ? null : () => handleSelectProvider(provider.name)}
                    >
                      <td className="border-b border-gray-200 p-4 text-white">{provider.name}</td>
                      <td className="border-b border-gray-200 p-4 text-white">{ provider.hasApiKey ? "Has API Key" : "No Key" }</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border-b border-gray-200 p-4 text-center text-white">
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
