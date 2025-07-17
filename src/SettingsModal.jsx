import React, { useState, useEffect } from 'react';
import config from './config';

const SettingsModal = ({ isOpen, onClose }) => {
  const [providers, setProviders] = useState([]);
  const [currentScrapingProvider, setCurrentScrapingProvider] = useState(-1);
  const [apiKeyInputs, setApiKeyInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch providers on modal open
  useEffect(() => {
    if (!isOpen) return;

    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${config.apiBaseUrl}/amazon/scraping-providers`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        setProviders(data.providers);
        setCurrentScrapingProvider(data.selectedProviderIndex);
        setApiKeyInputs(data.providers.reduce((acc, provider) => ({
          ...acc,
          [provider.name]: (provider.hasApiKey ? provider.apiKey : '')
        }), {}));
      } catch (err) {
        setError('Failed to fetch scraping providers');
        console.error('Fetch providers error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [isOpen]);

  // Set up SSE for real-time provider status
  /*
  useEffect(() => {
    if (!isOpen) return;

    const source = new EventSource(`${config.apiBaseUrl}/amazon/scraping-provider/events`, {
      withCredentials: true
    });

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'provider_status_update') {
        setProviders(prev => prev.map(provider => ({
          ...provider,
          status: data.data[provider.name] || { error: 'Status not supported' }
        })));
      }
    };

    source.onerror = () => {
      setError('Lost connection to provider status updates');
      source.close();
    };

    return () => {
      source.close();
    };
  }, [isOpen]);
  */

  // Handle selecting a provider
  const handleSelectProvider = async (providerName, index) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const response = await fetch(`${config.apiBaseUrl}/amazon/scraping-provider`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrapingProvider: providerName })
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentScrapingProvider(index);
        setSuccessMessage(`Selected provider: ${providerName}`);
        // Refresh provider status
        const statusResponse = await fetch(`${config.apiBaseUrl}/amazon/scraping-providers`, {
          method: 'GET',
          credentials: 'include',
        });
        const statusData = await statusResponse.json();
        setProviders(statusData.providers);
      } else {
        setError(data.error || 'Failed to select provider');
      }
    } catch (err) {
      setError('Failed to select provider');
      console.error('Select provider error:', err);
    }
  };

  const handleApiKeyChange = (providerName, value) => {
    setApiKeyInputs(prev => ({ ...prev, [providerName]: value }));
  };

  // Handle API key update
  const handleApiKeyUpdate = async (providerName) => {
    const apiKey = apiKeyInputs[providerName];
    if (!apiKey) {
      setError(`Please enter an API key for ${providerName}`);
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      const response = await fetch(`${config.apiBaseUrl}/amazon/scraping-provider-key`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrapingProvider: providerName, apiKey })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message);
        setProviders(prev => prev.map(p =>
          p.name === providerName ? { ...p, hasApiKey: true, apiKey: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` } : p
        ));
      } else {
        setError(data.error || 'Failed to update API key');
      }
    } catch (err) {
      setError('Failed to update API key');
      console.error('Update API key error:', err);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

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
        {successMessage && (
          <div className="bg-green-500 text-white p-2 rounded-md mb-4">
            {successMessage}
          </div>
        )}
        {loading ? (
          <div className="text-white text-center">Loading providers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 p-4 text-left text-white">Name</th>
                  <th className="border-b border-gray-200 p-4 text-left text-white">API Key</th>
                  <th className="border-b border-gray-200 p-4 text-left text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.length ? (
                  providers.map((provider, index) => (
                    <tr
                      key={provider.name}
                      className={index === currentScrapingProvider ? "bg-indigo-500" : "hover:bg-indigo-800 hover:cursor-pointer"}
                      onClick={() => handleSelectProvider(provider.name, index)}
                    >
                      <td className="border-b border-gray-200 p-4 text-white">{provider.name}</td>
                      <td className="border-b border-gray-200 p-4">
                        { provider.name != "MockAmazon" && (
                          <input
                            className="border border-white p-2 rounded-sm bg-gray-700 text-white w-full"
                            type="text"
                            placeholder="Enter API Key"
                            value={apiKeyInputs[provider.name] || ''}
                            onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />)
                        }
                      </td>
                      <td className="border-b border-gray-200 p-4 text-white">
                        {provider.status && !provider.status.error
                          ? `${provider.status.currentConcurrency || 0} / ${provider.status.maxConcurrency || 'N/A'}`
                          : 'N/A'}
                      </td>
                      <td className="border-b border-gray-200 p-4 text-white">
                        {provider.status && !provider.status.error
                          ? ((provider.status.maxApiCredit || 0) - (provider.status.usedApiCredit || 0)).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="border-b border-gray-200 p-4">
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded-md disabled:bg-gray-500"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleApiKeyUpdate(provider.name);
                          }}
                          disabled={apiKeyInputs[provider.name] === provider.apiKey || !apiKeyInputs[provider.name]}
                        >
                          Update
                        </button>
                      </td>
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