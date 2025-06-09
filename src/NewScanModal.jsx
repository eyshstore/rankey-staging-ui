import React, { useState } from 'react';

const NewScanModal = ({ isOpen, onClose, onCreateScan }) => {
  const [scanType, setScanType] = useState('Category');
  const [formData, setFormData] = useState({
    category: '',
    region: 'USA',
    categoryConcurrentRequests: 100,
    categoryMaxRequests: 100,
    strategy: 'breadth-first-left',
    pagesSkip: 5,
    scrapeAllSections: false,
    productsMaxRequests: 100,
    productsConcurrentRequests: 100,
    minRank: 1,
    maxRank: 10000,
    asins: [''],
  });

  const regions = [
    { value: 'USA', label: 'USA (https://www.amazon.com)' },
    { value: 'Germany', label: 'Germany (https://www.amazon.de)' },
  ];

  const categories = {
    USA: [
      { id: 2619526011, name: 'Appliances' },
      { id: 2617942011, name: 'Arts & Crafts' },
      { id: 15690151, name: 'Automotive' },
      { id: 165797011, name: 'Baby' },
    ],
    Germany: [
      { id: 78689031, name: 'Bekleidung' },
      { id: 931573031, name: 'Elektro-Großgeräte' },
      { id: 78193031, name: 'Auto & Motorrad' },
      { id: 357577011, name: 'Baby' },
    ],
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const scanData = {
      id: `a${Math.random().toString(36).substr(2, 4)}`, // Simple unique ID
      type: scanType,
      region: formData.region,
      category: formData.category,
      minRank: parseInt(formData.minRank),
      maxRank: parseInt(formData.maxRank),
      state: 'enqueued',
      ...(scanType === 'Category' && {
        categoryConcurrentRequests: parseInt(formData.categoryConcurrentRequests),
        categoryMaxRequests: parseInt(formData.categoryMaxRequests),
        strategy: formData.strategy,
        pagesSkip: parseInt(formData.pagesSkip),
        scrapeAllSections: formData.scrapeAllSections,
      }),
      ...(scanType === 'Deals' && {
        productsMaxRequests: parseInt(formData.productsMaxRequests),
        productsConcurrentRequests: parseInt(formData.productsConcurrentRequests),
      }),
      ...(scanType === 'ASINs' && {
        asins: formData.asins.filter(asin => asin.trim()),
      }),
    };
    onCreateScan(scanData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-1/3">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">New Scan</h2>
          <button
            className="text-white hover:text-gray-300"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200">Type</label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
            >
              <option value="Category">Category</option>
              <option value="Deals">Deals</option>
              <option value="ASINs">ASINs</option>
            </select>
          </div>

          {scanType === 'Category' && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Categories settings</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Region</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
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
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                >
                  <option value="">Select a category</option>
                  {categories[formData.region].map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Categories concurrent requests</label>
                <input
                  type="number"
                  name="categoryConcurrentRequests"
                  value={formData.categoryConcurrentRequests}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Categories max requests</label>
                <input
                  type="number"
                  name="categoryMaxRequests"
                  value={formData.categoryMaxRequests}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Strategy</label>
                <select
                  name="strategy"
                  value={formData.strategy}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                >
                  <option value="breadth-first-left">Breadth-first left</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Pages skip</label>
                <input
                  type="number"
                  name="pagesSkip"
                  value={formData.pagesSkip}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
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
              <h3 className="text-lg font-semibold mb-2">Deals settings</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Region</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
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
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                >
                  <option value="">Select a category</option>
                  {categories[formData.region].map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Products max requests</label>
                <input
                  type="number"
                  name="productsMaxRequests"
                  value={formData.productsMaxRequests}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Products concurrent requests</label>
                <input
                  type="number"
                  name="productsConcurrentRequests"
                  value={formData.productsConcurrentRequests}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                />
              </div>
            </div>
          )}

          {scanType === 'ASINs' && (
            <div>
              <h3 className="text-lg font-semibold mb-2">ASINs settings</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-200">Add one or several ASINs with spacebar</label>
                <button
                  type="button"
                  onClick={addAsinField}
                  className="bg-blue-600 hover:bg-blue-800 text-white p-2 rounded mb-2"
                >
                  Add
                </button>
                {formData.asins.map((asin, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={asin}
                      onChange={(e) => handleAsinChange(index, e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
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
                <label className="block text-sm font-medium text-gray-200">Products concurrent requests</label>
                <input
                  type="number"
                  name="productsConcurrentRequests"
                  value={formData.productsConcurrentRequests}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200">Min & max rank</label>
            <div className="flex space-x-2">
              <input
                type="number"
                name="minRank"
                value={formData.minRank}
                onChange={handleInputChange}
                className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded"
              />
              <input
                type="number"
                name="maxRank"
                value={formData.maxRank}
                onChange={handleInputChange}
                className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-800 text-white p-2 rounded w-full"
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewScanModal;