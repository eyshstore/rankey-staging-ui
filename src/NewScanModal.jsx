import React, { useState, useEffect, useCallback } from 'react';
import config from './config';
import useRequest from '../hooks/useRequest.hook';

import SelectInput from './inputs/SelectInput';

import ASINForm from './forms/ASINForm';
import CategoryForm from './forms/CategoryForm';
import DealsForm from './forms/DealsForm';

const NewScanModal = ({ isOpen, onClose }) => {
  const mainCategoriesRequest = useRequest();
  const submitRequest = useRequest();
  const scrapingProviderStatusApiEndpointRequest = useRequest();

  const [scanType, setScanType] = useState('ASIN');
  const [selectedScrapingProviderHasConcurrencyInfo, setSelectedScrapingProviderHasConcurrencyInfo] = useState(true);

  // Utility Functions
  const [formData, setFormData] = useState({
    domain: 'com',
    ASINs: [],
    maxConcurrentRequests: 1,
    numberOfProductsToGather: 10000,
    strategy: 'breadth-first-start',
    usePagesSkip: false,
    pagesSkip: 5,
    scrapeAllSections: false,
    minRank: 1,
    maxRank: 1000000,
    mainCategoryId: '',
    maxRerequests: 3,
    maxRequests: 10000,
  });

  const [mainCategories, setMainCategories] = useState({
    com: [],
    de: [],
  });

  const domains = [
    { value: 'com', label: 'USA (https://www.amazon.com)' },
    { value: 'de', label: 'Germany (https://www.amazon.de)' },
  ];

  // API Calls
  const fetchMainCategories = async (domain) => {
    const response = await mainCategoriesRequest.request(`${config.apiBaseUrl}/amazon/main-categories?domain=${domain}`);
    setMainCategories(prev => ({ ...prev, [domain]: response.mainCategories, }));
    if (domain == "com" && response.mainCategories.length) {
      setFormData(prev => ({ ...prev, mainCategoryId: response.mainCategories[0]._id, }))
    }
  };

  const checkScrapingProviderStatusApiEndpoint = async () => {
    try {
      const response = await scrapingProviderStatusApiEndpointRequest.request(`${config.apiBaseUrl}/amazon/scraping-providers/concurrency`);
      console.log(response);
      setSelectedScrapingProviderHasConcurrencyInfo(response.selectedScrapingProviderHasConcurrencyInfo);
    } catch (error) {
      // Handle error silently as in original code
    }
  };

  // Effects
  useEffect(() => {
    const updateInfo = async () => {
      if (isOpen) {
        await fetchMainCategories("com");
        await fetchMainCategories("de");
        checkScrapingProviderStatusApiEndpoint();
      }
    };

    updateInfo();
  }, [isOpen]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      let newValue;

      if (type === "checkbox") {
        newValue = checked;
      } else if (type === "number") {
        // Keep as string so user can type freely (including empty value)
        newValue = value;
      } else {
        newValue = value;
      }

      if (name == "minRank" && value > formData.maxRank) { newValue = formData.maxRank; }
      if (name == "maxRank" && value < formData.minRank) { newValue = formData.minRank; }

      return { ...prev, [name]: newValue };
    });
  };

  const mainCategoryOnChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      mainCategoryId: mainCategories[formData.domain].find((mainCategory) => mainCategory._id === e.target.value)?._id || '',
    }));
  };  

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const scanData = {
      type: scanType,
      domain: formData.domain,
      maxConcurrentRequests: formData.maxConcurrentRequests,
      maxRequests: Number(formData.maxRequests),
      maxRerequests: Number(formData.maxRerequests),
    };

    if (scanType === 'ASIN') {
      if (!formData.ASINs.length || !formData.ASINs.every((asin) => /^[A-Z0-9]{10}$/.test(asin))) {
        alert('Please enter at least one valid ASIN (10 characters, alphanumeric).');
        return;
      }
      scanData.ASINs = formData.ASINs;
    } else if (scanType === 'Category') {
      scanData.mainCategoryId = formData.mainCategoryId;
      scanData.strategy = formData.strategy;
      scanData.usePagesSkip = formData.usePagesSkip;
      scanData.pagesSkip = Number(formData.pagesSkip);
      scanData.numberOfProductsToGather = Number(formData.numberOfProductsToGather);
      scanData.minRank = Number(formData.minRank);
      scanData.maxRank = Number(formData.maxRank);
    } else if (scanType === 'Deals') {
      if (Number(formData.numberOfProductsToGather) < 1) {
        alert('Number of products to gather must be at least 1 for Deals scans.');
        return;
      }
      scanData.mainCategoryId = formData.mainCategoryId;
      scanData.numberOfProductsToGather = Number(formData.numberOfProductsToGather);
    }

    try {
      await submitRequest.request(`${config.apiBaseUrl}/amazon/scans/enqueue`, 'POST', { config: scanData });
      onClose();
      setFormData((prev) => ({ ...prev, ASINs: [] }));
    } catch (error) {
      console.log(error);
    }
  }, [scanType, formData, submitRequest, onClose]);

  useEffect(() => {
    submitRequest.clearError();
  }, [scanType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-white">New Scan</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {submitRequest.error && (
          <p className="bg-red-500 rounded mb-2 p-2 text-white">{submitRequest.error.message}</p>
        )}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>

            <SelectInput
              label="Type"
              name="scanType"
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              options={[
                { value: 'ASIN', label: 'ASIN' },
                { value: 'Category', label: 'Category' },
                { value: 'Deals', label: 'Deals' },
              ]}
            />
          </div>
          <div>
            <SelectInput
              label="Domain"
              name="domain"
              value={formData.domain}
              onChange={handleInputChange}
              options={domains}
            />
          </div>

          <div className="col-span-2 flex gap-4">
            <div className="flex-1">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-200">Max Requests</label>
                <input
                  type="number"
                  name="maxRequests"
                  id="maxRequests"
                  value={formData.maxRequests ?? ''}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-200">Max Re-requests</label>
                <input
                  type="number"
                  name="maxRerequests"
                  id="maxRerequests"
                  value={formData.maxRerequests ?? ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {!selectedScrapingProviderHasConcurrencyInfo && (
            <div className="col-span-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-200">Max Concurrent Requests</label>
                <input
                  type="number"
                  name="maxConcurrentRequests"
                  id="maxConcurrentRequests"
                  value={formData.maxConcurrentRequests ?? ''}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
          {scanType === 'ASIN' && <ASINForm formData={formData} setFormData={setFormData} />}
          {
            scanType === 'Category' && !mainCategoriesRequest.loading &&
            <CategoryForm
              mainCategories={mainCategories[formData.domain]}
              handleInputChange={handleInputChange}
              formData={formData}
              mainCategoryOnChange={mainCategoryOnChange}
            />
          }
          { scanType === 'Deals' && !mainCategoriesRequest.loading &&
          <DealsForm
              mainCategories={mainCategories[formData.domain]}
              handleInputChange={handleInputChange}
              formData={formData}
              mainCategoryOnChange={mainCategoryOnChange}
          />
          }
          <button
            type="submit"
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 hover:cursor-pointer transition disabled:bg-gray-400"
            disabled={submitRequest.loading && mainCategoriesRequest.loading}
          >
            Start Scan
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewScanModal;
