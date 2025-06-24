import React, { useState, useEffect } from 'react';

import config from './config';

import useRequest from "../hooks/useRequest.hook";

const NewScanModal = ({ isOpen, onClose, onCreateScan }) => {
  const mainCategoriesRequest = useRequest();
  const [scanType, setScanType] = useState('Category');
  const [formData, setFormData] = useState({
    category: '',
    region: 'USA',
    categoryConcurrentRequests: 5, // Align with backend MAX_REQUESTS
    categoryMaxRequests: 100,
    strategy: 'breadth-first-left',
    pagesSkip: 5,
    scrapeAllSections: false,
    productsMaxRequests: 8, // Align with backend MAX_REQUESTS
    productsConcurrentRequests: 8,
    minRank: 1,
    maxRank: 10000,
    asins: [''],
    scrapingProvider: 'MockAmazon', // Default for testing
  });

  const [categories, setCategories] = useState({
    USA: [],
    Germany: [],
  });

  // Fetch categories on mount
  useEffect(() => {
    /*
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/amazon/categories?domain=com`, { credentials: 'include' });
        const usaCategories = await response.json();
        const responseDe = await fetch(`${config.apiBaseUrl}/amazon/categories?domain=de`, { credentials: 'include' });
        const germanyCategories = await responseDe.json();
        setCategories({
          USA: usaCategories.map(cat => ({ id: cat._id, name: cat.name })),
          Germany: germanyCategories.map(cat => ({ id: cat._id, name: cat.name })),
        });
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
    */
  }, []);

  const regions = [
    { value: 'USA', label: 'USA (https://www.amazon.com)', domain: 'com' },
    { value: 'Germany', label: 'Germany (https://www.amazon.de)', domain: 'de' },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name == "regions") {
      mainCategoriesRequest.request(`${apiBaseUrl}/amazon/main-categories`);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAsinChange = (index, value) => {
    const newAsins = [...formData.asins];
    newAsins[index] = value;
    setFormData(prev => ({ ...prev, asins: newAsins }));
  };

  const addAsinField = () => {
    setFormData(prev => ({ ...prev, asins: [...prev.asins, ''] }));
  };

  const removeAsinField = (index) => {
    const newAsins = formData.asins.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, asins: newAsins }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedRegion = regions.find(r => r.value === formData.region);
    const domain = selectedRegion.domain;
    const selectedCategory = categories[formData.region].find(cat => cat.name === formData.category);

    const scanData = {
      id: `a${Math.random().toString(36).substr(2, 4)}`,
      type: scanType,
      domain,
      category: formData.category,
      categoryId: selectedCategory?.id,
      minRank: parseInt(formData.minRank),
      maxRank: parseInt(formData.maxRank),
      state: 'enqueued',
      scrapingProvider: formData.scrapingProvider,
      ...(scanType === 'Category' && {
        categoryConcurrentRequests: parseInt(formData.categoryConcurrentRequests),
        categoryMaxRequests: parseInt(formData.categoryMaxRequests),
        strategy: formData.strategy,
        pagesSkip: parseInt(formData.pagesSkip),
        categoriesThrottlingOptimization: !formData.scrapeAllSections,
        productsToGather: parseInt(formData.maxRank) - parseInt(formData.minRank) + 1,
        productExpiration: 24 * 60 * 60 * 1000, // 1 day default
      }),
      ...(scanType === 'Deals' && {
        dealsCategory: formData.category,
        productsMaxRequests: parseInt(formData.productsMaxRequests),
        productsConcurrentRequests: parseInt(formData.productsConcurrentRequests),
        productExpiration: 24 * 60 * 60 * 1000,
      }),
      ...(scanType === 'ASINs' && {
        asins: formData.asins.filter(asin => /^[A-Z0-9]{10}$/.test(asin.trim())),
        productsConcurrentRequests: parseInt(formData.productsConcurrentRequests),
        productExpiration: 24 * 60 * 60 * 1000,
      }),
    };

    try {
      const response = await fetch(`${config.apiBaseUrl}/amazon/start-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(scanData),
      });
      const result = await response.json();
      if (response.ok) {
        onCreateScan({ ...scanData, id: result._id || scanData.id });
        onClose();
      } else {
        console.error('Failed to start scan:', result.error);
      }
    } catch (error) {
      console.error('Error submitting scan:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-1/3 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-white">New Scan</h2>
          <button
            className="text-white hover:text-gray-300"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200">Type</label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="Category">Category</option>
              <option value="Deals">Deals</option>
              <option value="ASINs">ASINs</option>
            </select>
          </div>

          {scanType === 'Category' && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Category Settings</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Region</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  {regions.map(region => (
                    <option key={region.value} value={region.value}>{region.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Select a category</option>
                  {categories[formData.region].map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Categories Concurrent Requests</label>
                <input
                  type="number"
                  name="categoryConcurrentRequests"
                  value={formData.categoryConcurrentRequests}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Categories Max Requests</label>
                <input
                  type="number"
                  name="categoryMaxRequests"
                  value={formData.categoryMaxRequests}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Strategy</label>
                <select
                  name="strategy"
                  value={formData.strategy}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="breadth-first-left">Breadth-first left</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Pages Skip</label>
                <input
                  type="number"
                  name="pagesSkip"
                  value={formData.pagesSkip}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div className="mb-2 flex items-center">
                <input
                  type="checkbox"
                  name="scrapeAllSections"
                  checked={formData.scrapeAllSections}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-200">Scrape all sections</label>
              </div>
            </div>
          )}

          {scanType === 'Deals' && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Deals Settings</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Region</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  {regions.map(region => (
                    <option key={region.value} value={region.value}>{region.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Select a category</option>
                  {categories[formData.region].map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Products Max Requests</label>
                <input
                  type="number"
                  name="productsMaxRequests"
                  value={formData.productsMaxRequests}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Products Concurrent Requests</label>
                <input
                  type="number"
                  name="productsConcurrentRequests"
                  value={formData.productsConcurrentRequests}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
          )}

          {scanType === 'ASINs' && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">ASINs Settings</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">ASINs</label>
                <button
                  type="button"
                  onClick={addAsinField}
                  className="bg-blue-600 hover:bg-blue-800 text-white p-2 rounded mb-2"
                >
                  Add ASIN
                </button>
                {formData.asins.map((asin, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={asin}
                      onChange={(e) => handleAsinChange(index, e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder={`ASIN ${index + 1}`}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeAsinField(index)}
                        className="ml-2 bg-red-600 hover:bg-red-800 text-white p-2 rounded"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Products Concurrent Requests</label>
                <input
                  type="number"
                  name="productsConcurrentRequests"
                  value={formData.productsConcurrentRequests}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200">Min & Max Rank</label>
            <div className="flex space-x-2">
              <input
                type="number"
                name="minRank"
                value={formData.minRank}
                onChange={handleInputChange}
                min="1"
                className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <input
                type="number"
                name="maxRank"
                value={formData.maxRank}
                onChange={handleInputChange}
                min="1"
                className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200">Scraping Provider</label>
            <select
              name="scrapingProvider"
              value={formData.scrapingProvider}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="MockAmazon">MockAmazon (Testing)</option>
              {/* Add other providers as needed */}
            </select>
          </div>

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-800 text-white p-2 rounded w-full"
          >
            Create Scan
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewScanModal;