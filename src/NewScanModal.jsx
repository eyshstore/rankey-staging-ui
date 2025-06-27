import React, { useState, useEffect } from 'react';
import config from './config';
import useRequest from "../hooks/useRequest.hook";

const NewScanModal = ({ isOpen, onClose, onCreateScan }) => {
  const mainCategoriesRequest = useRequest();
  const [scanType, setScanType] = useState('ASINs');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    domain: 'com',
    asins: [''],
    productsConcurrentRequests: 8,
    category: '',
    categoryConcurrentRequests: 5,
    categoryMaxRequests: 100,
    strategy: 'breadth-first-left',
    pagesSkip: 5,
    scrapeAllSections: false,
    productsMaxRequests: 8,
    minRank: 1,
    maxRank: 10000,
    scrapingProvider: 'MockAmazon',
  });

  const [categories, setCategories] = useState({
    com: [],
    de: [],
  });

  const domains = [
    { value: 'com', label: 'USA (https://www.amazon.com)' },
    { value: 'de', label: 'Germany (https://www.amazon.de)' },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await mainCategoriesRequest.request(`${config.apiBaseUrl}/amazon/main-categories?domain=${formData.domain}`);
      setCategories(prev => ({ ...prev, [formData.domain]: response.mainCategories || [] }));
    };
    if (scanType === 'Category') fetchCategories();
  }, [formData.domain, scanType]);

  useEffect(() => {
    const totalPages = Math.ceil(formData.asins.length / itemsPerPage);
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [formData.asins, currentPage, itemsPerPage]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scanData = {
      type: scanType,
      domain: formData.domain,
      state: 'enqueued',
      scrapingProvider: formData.scrapingProvider,
    };

    if (scanType === 'ASINs') {
      scanData.asins = formData.asins.filter(asin => /^[A-Z0-9]{10}$/.test(asin.trim()));
      scanData.productsConcurrentRequests = parseInt(formData.productsConcurrentRequests);
    } else if (scanType === 'Category') {
      const selectedCategory = categories[formData.domain].find(cat => cat.name === formData.category);
      scanData.category = formData.category;
      scanData.categoryId = selectedCategory?.id;
      scanData.categoryConcurrentRequests = parseInt(formData.categoryConcurrentRequests);
      scanData.categoryMaxRequests = parseInt(formData.categoryMaxRequests);
      scanData.strategy = formData.strategy;
      scanData.pagesSkip = parseInt(formData.pagesSkip);
      scanData.scrapeAllSections = formData.scrapeAllSections;
      scanData.minRank = parseInt(formData.minRank);
      scanData.maxRank = parseInt(formData.maxRank);
      scanData.productsToGather = parseInt(formData.maxRank) - parseInt(formData.minRank) + 1;
      scanData.productExpiration = 24 * 60 * 60 * 1000;
    } else if (scanType === 'Deals') {
      scanData.category = formData.category;
      scanData.productsMaxRequests = parseInt(formData.productsMaxRequests);
      scanData.productsConcurrentRequests = parseInt(formData.productsConcurrentRequests);
      scanData.productExpiration = 24 * 60 * 60 * 1000;
    }

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

  const totalPages = Math.ceil(formData.asins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAsins = formData.asins.slice(startIndex, endIndex);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-1/2 max-h-[80vh] flex flex-col">
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
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-200">Type</label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="ASINs">ASINs</option>
              <option value="Category">Category</option>
              <option value="Deals">Deals</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200">Domain</label>
            <select
              name="domain"
              value={formData.domain}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              {domains.map(domain => (
                <option key={domain.value} value={domain.value}>{domain.label}</option>
              ))}
            </select>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
          {scanType === 'ASINs' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200">ASINs</label>
                <div className="mb-2">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const handleCsvUpload = (file) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target.result;
                          const rows = text.split('\n').map((row) => row.split(','));
                          processRows(rows);
                        };
                        reader.readAsText(file);
                      };
                    
                      // Process XLSX file
                      const handleXlsxUpload = (file) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const data = event.target.result;
                          const workbook = XLSX.read(data, { type: 'binary' });
                          const sheetName = workbook.SheetNames[0]; // Use first sheet
                          const sheet = workbook.Sheets[sheetName];
                          // Convert sheet to array of rows
                          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                          processRows(rows);
                        };
                        reader.readAsBinaryString(file);
                      };
                    
                      // Extract ASINs from rows
                      const processRows = (rows) => {
                        if (rows.length === 0) {
                          alert('The uploaded file is empty.');
                          return;
                        }
                    
                        // Get header row and convert to lowercase for case-insensitive search
                        const header = rows[0].map((cell) => String(cell).toLowerCase());
                        const asinIndex = header.findIndex((cell) => cell.includes('asin'));
                    
                        if (asinIndex === -1) {
                          alert('No column with "ASIN" found in the file.');
                          return;
                        }
                    
                        // Extract ASINs from the identified column, skipping the header row
                        const extractedAsins = rows.slice(1)
                          .map((row) => row[asinIndex])
                          .filter((asin) => /^[A-Z0-9]{10}$/.test(asin)); // Validate ASIN format
                    
                        setFormData(prev => ({ ...prev, asins: extractedAsins }));
                      };

                      const fileExtension = file.name.split('.').pop().toLowerCase();

                      if (fileExtension === 'csv') {
                        handleCsvUpload(file);
                      } else if (fileExtension === 'xlsx') {
                        handleXlsxUpload(file);
                      } else {
                        alert('Unsupported file format. Please upload a CSV or XLSX file.');
                      }
                    }}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <table className="w-full text-white">
                  <thead>
                    <tr>
                      <th className="p-2 border-b">ASIN</th>
                      <th className="p-2 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAsins.map((asin, index) => (
                      <tr key={startIndex + index}>
                        <td className="p-2 border-b">
                          <input
                            type="text"
                            value={asin}
                            onChange={(e) => handleAsinChange(startIndex + index, e.target.value)}
                            className="w-full bg-gray-700 p-1 rounded"
                            placeholder={`ASIN ${startIndex + index + 1}`}
                          />
                        </td>
                        <td className="p-2 border-b">
                          <button
                            type="button"
                            onClick={() => removeAsinField(startIndex + index)}
                            className="bg-red-600 hover:bg-red-800 text-white p-1 rounded"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={addAsinField}
                  className="bg-blue-600 hover:bg-blue-800 text-white p-2 rounded mt-2"
                >
                  Add ASIN
                </button>
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded"
                  >
                    Previous
                  </button>
                  <span className="text-white">Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="mb-4">
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
          {scanType === 'Category' && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">Select a category</option>
                    {categories[formData.domain].map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
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
                <div>
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
                <div>
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
                <div>
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
                <div className="col-span-2">
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
                <div className="col-span-2">
                  <div className="flex items-center">
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
              </div>
            </div>
          )}
          {scanType === 'Deals' && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">Select a category</option>
                    {categories[formData.domain].map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
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
                <div>
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
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded mt-4"
          >
            Start Scan
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewScanModal;