import React, { useState, useEffect } from "react";
import config from "./config";
import useRequest from "../hooks/useRequest.hook";

// Reusable modal for entering API keys
const ApiKeyModal = ({ providerName, isOpen, onClose, onSubmit }) => {
  const [apiKey, setApiKey] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(apiKey);
    setApiKey("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">
          Enter {providerName} API Key
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API Key"
            className="w-full p-2 rounded-md mb-4 bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose }) => {
  const [availableScrapingProviders, setAvailableScrapingProviders] = useState([]);
  const [selectedScrapingProviderName, setSelectedScrapingProviderName] = useState(null);
  const [error, setError] = useState(null);

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState(null);

  // Separate requests
  const scrapingProvidersRequest = useRequest();
  const scrapingProviderApiKeyRequest = useRequest();

  const fetchProviders = async () => {
    try {
      const data = await scrapingProvidersRequest.request(
        `${config.apiBaseUrl}/amazon/scraping-providers`
      );
      setAvailableScrapingProviders(data.availableScrapingProviders);
      setSelectedScrapingProviderName(data.selectedScrapingProviderName);
    } catch (error) {
      setError(error);
    }
  };

  const handleRenewCredits = async (event) => {
    event.stopPropagation();
    await scrapingProvidersRequest.request(
      `${config.apiBaseUrl}/amazon/scraping-providers/renew`,
      "POST"
    );
    console.log("Credits for MockAmazonProvider successfully renewed.");
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchProviders();
  }, [isOpen]);

  const handleSelectProvider = async (providerName) => {
    if (scrapingProviderApiKeyRequest.loading) return; // block multiple clicks
    try {
      await scrapingProviderApiKeyRequest.request(
        `${config.apiBaseUrl}/amazon/scraping-providers/select`,
        "POST",
        { providerName }
      );
      fetchProviders();
    } catch (error) {
      if (error.code === "NO_API_KEY") {
        setPendingProvider(providerName);
        setApiKeyModalOpen(true);
      } else {
        setError(error);
      }
    }
  };

  const handleApiKeySubmit = async (apiKey) => {
    if (!apiKey || !pendingProvider) {
      setError("No API key was provided.");
      return;
    }

    try {
      await scrapingProviderApiKeyRequest.request(
        `${config.apiBaseUrl}/amazon/scraping-providers/key`,
        "POST",
        { apiKey, providerName: pendingProvider }
      );

      await scrapingProviderApiKeyRequest.request(
        `${config.apiBaseUrl}/amazon/scraping-providers/select`,
        "POST",
        { providerName: pendingProvider }
      );

      fetchProviders();
    } catch (error) {
      setError(`Failed to update API key: ${error.message}`);
    } finally {
      setApiKeyModalOpen(false);
      setPendingProvider(null);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-gray-800 p-6 rounded-lg w-3/4 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Scraping Provider Settings</h2>
          <button className="text-white hover:text-gray-300" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          className="button bg-red-500 hover:bg-red-700 text-white p-2 m-2 rounded-md shrink-0"
          onClick={handleRenewCredits}
          disabled={scrapingProviderApiKeyRequest.loading}
        >
          Renew MockAmazonProvider
        </button>

        {error && (
          <div className="bg-red-500 text-white p-2 rounded-md mb-4">
            {error.message || error}
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
                  availableScrapingProviders.map((provider) => (
                    <tr
                      key={provider.name}
                      className={
                        provider.name === selectedScrapingProviderName
                          ? "bg-indigo-500"
                          : "hover:bg-indigo-800 hover:cursor-pointer"
                      }
                      onClick={() =>
                        !scrapingProviderApiKeyRequest.loading &&
                        provider.name !== selectedScrapingProviderName &&
                        handleSelectProvider(provider.name)
                      }
                      style={{
                        opacity: scrapingProviderApiKeyRequest.loading ? 0.5 : 1,
                        pointerEvents: scrapingProviderApiKeyRequest.loading ? "none" : "auto",
                      }}
                    >
                      <td className="border-b border-gray-200 p-4 text-white">{provider.name}</td>
                      <td className="border-b border-gray-200 p-4 text-white flex items-center gap-3">
                        {provider.hasApiKey ? (
                          <>
                            <span>Has API Key</span>
                            {provider.name !== "MockAmazonProvider" && (
                              <button
                                className="text-indigo-300 hover:text-indigo-100 text-sm flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation(); // don’t trigger row select
                                  setPendingProvider(provider.name);
                                  setApiKeyModalOpen(true);
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.232 5.232a3 3 0 014.243 4.243L8.5 20.45l-4.95 1.414L5 16.5l10.232-11.268z"
                                  />
                                </svg>
                                Update
                              </button>
                            )}
                          </>
                        ) : (
                          <span>No Key</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="border-b border-gray-200 p-4 text-center text-white"
                    >
                      No scraping providers available
                    </td>
                  </tr>
                )}
              </tbody>


            </table>
          </div>
        )}
      </div>

      <ApiKeyModal
        providerName={pendingProvider}
        isOpen={apiKeyModalOpen}
        onClose={() => {
          setApiKeyModalOpen(false);
          setPendingProvider(null);
        }}
        onSubmit={handleApiKeySubmit}
      />
    </div>
  );
};

export default SettingsModal;
