import React, { useState, useEffect } from 'react';
import config from './config';
import useRequest from "../hooks/useRequest.hook";
import * as XLSX from "xlsx";

const NewScanModal = ({ isOpen, onClose }) => {
  const mainCategoriesRequest = useRequest();
  const submitRequest = useRequest();

  const [scanType, setScanType] = useState('ASIN');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    domain: 'com',
    ASINs: [],
    maxProductsConcurrentRequests: 1,
    numberOfProductsToGather: 10000,
    categoryConcurrentRequests: 1,
    strategy: 'breadth-first-left',
    pagesSkip: 5,
    scrapeAllSections: false,
    minRank: 1,
    maxRank: 10000,

    useProductExpiration: false,
    productExpiration: getFormattedDateTime(new Date()),
  });
  const [newAsin, setNewAsin] = useState('');

  const [categories, setCategories] = useState({
    com: [],
    de: [],
  });

  const domains = [
    { value: 'com', label: 'USA (https://www.amazon.com)' },
    { value: 'de', label: 'Germany (https://www.amazon.de)' },
  ];

  function getFormattedDateTime(date) {
    const pad = (num) => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  useEffect(() => {
    const fetchCategories = async () => {
      if (!categories[formData.domain]?.length) {
        const response = await mainCategoriesRequest.request(`${config.apiBaseUrl}/amazon/main-categories?domain=${formData.domain}`);
        if (response.mainCategories.length) {
          setCategories(prev => ({ ...prev, [formData.domain]: response.mainCategories || [] }));
          setFormData(prev => ({ ...prev, category: response.mainCategories[0] }));
        }
      }
    };
    fetchCategories();
  }, [formData.domain]);

  useEffect(() => {
    const totalPages = Math.ceil(formData.ASINs.length / itemsPerPage);
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [formData.ASINs, currentPage, itemsPerPage]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "maxRank" && value < formData.minRank) {
      e.target.value = value + 1;
      return;
    }

    if (name === "minRank" && value > formData.maxRank) {
      e.target.value = value - 1;
      return;
    }

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addAsinField = () => {
    const asin = newAsin.trim().toUpperCase();

    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      alert('Please enter a valid ASIN (10 characters, alphanumeric)');
      return;
    }

    if (formData.ASINs.includes(asin)) {
      alert('This ASIN is already in the list.');
      return;
    }

    setFormData(prev => {
      const updatedASINs = [...prev.ASINs, asin];
      setCurrentPage(Math.ceil(updatedASINs.length / itemsPerPage));
      return { ...prev, ASINs: updatedASINs };
    });

    setNewAsin('');
  };

  const removeAsinField = (index) => {
    const newASINs = formData.ASINs.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, ASINs: newASINs }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scanData = {
      type: scanType,
      domain: formData.domain,
      maxProductsConcurrentRequests: parseInt(formData.maxProductsConcurrentRequests),
      
      minRank: parseInt(formData.minRank),
      maxRank: parseInt(formData.maxRank),

      useProductExpiration: formData.useProductExpiration,
      productExpiration: formData.productExpiration,
    };

    if (scanType === 'ASIN') {
      if (!formData.ASINs.length || !formData.ASINs.every(asin => /^[A-Z0-9]{10}$/.test(asin))) {
        alert("Please enter at least one valid ASIN (10 characters, alphanumeric).");
        return;
      }
      scanData.ASINs = formData.ASINs;
    } else if (scanType === 'Category') {
      if (parseInt(formData.numberOfProductsToGather) < 24) {
        alert('Number of products to gather must be at least 24 for Category scans.');
        return;
      }
      scanData.categoryId = formData.category._id;
      scanData.categoryConcurrentRequests = parseInt(formData.categoryConcurrentRequests);
      scanData.strategy = formData.strategy;
      scanData.pagesSkip = parseInt(formData.pagesSkip);
      scanData.numberOfProductsToGather = parseInt(formData.numberOfProductsToGather);
    } else if (scanType === 'Deals') {
      if (parseInt(formData.numberOfProductsToGather) < 24) {
        alert('Number of products to gather must be at least 24 for Deals scans.');
        return;
      }
      scanData.categoryId = formData.category._id;
      scanData.numberOfProductsToGather = parseInt(formData.numberOfProductsToGather);
    }

    const result = await submitRequest.request(`${config.apiBaseUrl}/amazon/start-scan`, { method: "POST" }, scanData);
    if (result.error) {
      return;
    }
    onClose();
    setFormData(prev => ({ ...prev, ASINs: [] }));
  };

  if (!isOpen) return null;

  const totalPages = formData.ASINs.length ? Math.ceil(formData.ASINs.length / itemsPerPage) : 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentAsins = formData.ASINs.slice(startIndex, endIndex);

  let payloadForm;
  if (scanType === "ASIN") {
    payloadForm = (
      <div>
        <div className="mb-4">
          <div className="mt-4">
            <input id="fileUpload" accept=".csv,.xlsx" type="file" className="hidden" onChange={(e) => {
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

              const handleXlsxUpload = (file) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const data = event.target.result;
                  const workbook = XLSX.read(data, { type: 'binary' });
                  const sheetName = workbook.SheetNames[0];
                  const sheet = workbook.Sheets[sheetName];
                  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                  processRows(rows);
                };
                reader.readAsBinaryString(file);
              };

              const processRows = (rows) => {
                if (rows.length === 0) {
                  alert('The uploaded file is empty.');
                  return;
                }

                const header = rows[0].map((cell) => String(cell).toLowerCase());
                const asinIndex = header.findIndex((cell) => cell.includes('asin'));

                if (asinIndex === -1) {
                  alert('No column with "ASIN" found in the file.');
                  return;
                }

                const extractedASINs = rows
                  .slice(1)
                  .map((row) => row[asinIndex]?.toString().trim().toUpperCase())
                  .filter((ASIN) => /^[A-Z0-9]{10}$/.test(ASIN));

                setFormData(prev => {
                  const unique = new Set(extractedASINs);
                  const newList = Array.from(unique);
                  setCurrentPage(Math.ceil(newList.length / itemsPerPage));
                  return { ...prev, ASINs: newList };
                });
              };

              const fileExtension = file.name.split('.').pop().toLowerCase();

              if (fileExtension === 'csv') {
                handleCsvUpload(file);
              } else if (fileExtension === 'xlsx') {
                handleXlsxUpload(file);
              } else {
                alert('Unsupported file format. Please upload a CSV or XLSX file.');
              }

              e.target.value = null;
            }} />
            <label htmlFor="fileUpload" className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Upload file with ASINs</label>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, ASINs: [] }))} className="bg-red-600 hover:cursor-pointer hover:bg-red-800 text-white p-2 ml-2 rounded">Reset</button>
          </div>
          <table className="w-full text-white">
            <thead>
              <tr>
                <th className="p-2 border-b"></th>
                <th className="p-2 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {currentAsins.map((asin, index) => (
                <tr key={startIndex + index}>
                  <td className="p-2 border-b">
                    <span className="w-full p-1 rounded">{asin}</span>
                  </td>
                  <td className="p-2 border-b text-right">
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
          <div className="flex items-center space-x-2 mt-2">
            <button
              type="button"
              onClick={addAsinField}
              className="bg-blue-600 hover:bg-blue-800 text-white p-2 rounded"
            >
              Add ASIN
            </button>
            <input
              type="text"
              value={newAsin}
              onChange={(e) => setNewAsin(e.target.value)}
              className="flex-1 bg-gray-700 p-1 rounded"
              placeholder="Enter new ASIN"
              maxLength={10}
            />
          </div>
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
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded mt-4"
        >
          Start Scan
        </button>
      </div>
    );
  } else if (scanType === "Category") {
    if (categories[formData.domain].length) {
      payloadForm = (
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
                {categories[formData.domain].map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
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
              <label className="block text-sm font-medium text-gray-200">Strategy</label>
              <select
                name="strategy"
                value={formData.strategy}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="breadth-first-left">Breadth-first left</option>
                <option value="breadth-first-right">Breadth-first right</option>
                <option value="depth-first-left">Depth-first left</option>
                <option value="depth-first-right">Depth-first right</option>
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
              <div>
                <label className="block text-sm font-medium text-gray-200">Products to gather</label>
                <input
                  type="number"
                  name="numberOfProductsToGather"
                  value={formData.numberOfProductsToGather}
                  onChange={handleInputChange}
                  min="24"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded mt-4"
            >
              Start Scan
            </button>
          </div>
        </div>
      );
    } else {
      payloadForm = <p>No complete categories are available for this domain. Please, gather categories in this domain first.</p>;
    }
  } else if (scanType === "Deals") {
    if (categories[formData.domain].length) {
      payloadForm = (
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
                {categories[formData.domain].map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200">Number of products to gather</label>
              <input
                type="number"
                name="numberOfProductsToGather"
                value={formData.numberOfProductsToGather}
                onChange={handleInputChange}
                min="24"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded mt-4"
          >
            Start Scan
          </button>
        </div>
      );
    } else {
      payloadForm = <p>No complete categories are available for this domain. Please, gather categories in this domain first.</p>;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-1/2 max-h-[90vh] flex flex-col">
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
              <option value="ASIN">ASIN</option>
              <option value="Category">Category</option>
              <option value="Deals">Deals</option>
            </select>
          </div>
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-200">Domain</label>
            <select
              id="domain"
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
          <div>
            <label className="block text-sm font-medium text-gray-200 flex items-center">
              <input
                type="checkbox"
                id="useProductExpiration"
                name="useProductExpiration"
                checked={formData.useProductExpiration}
                onChange={handleInputChange}
                className="mr-2"
              />
              Enable Product Expiration Check
            </label>
            <input
              type="datetime-local"
              id="productExpiration"
              name="productExpiration"
              value={formData.productExpiration}
              onChange={handleInputChange}
              disabled={!formData.useProductExpiration}
              className={`w-full p-2 bg-gray-700 border border-gray-600 rounded text-white ${!formData.useProductExpiration ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200">Products Concurrent Requests</label>
            <input
              type="number"
              name="maxProductsConcurrentRequests"
              value={formData.maxProductsConcurrentRequests}
              onChange={handleInputChange}
              min="1"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
        <div>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
          {payloadForm}
        </form>
        {submitRequest.error && <p className="bg-red-500 rounded p-2 my-2">{submitRequest.error.error}</p>}
      </div>
    </div>
  );
};

export default NewScanModal;