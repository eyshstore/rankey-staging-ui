import React, { useState, useEffect, useCallback } from 'react';
import config from './config';
import useRequest from '../hooks/useRequest.hook';
import * as XLSX from 'xlsx';

const NewScanModal = ({ isOpen, onClose }) => {
  const mainCategoriesRequest = useRequest();
  const submitRequest = useRequest();
  const scrapingProviderStatusApiEndpointRequest = useRequest();

  const [scanType, setScanType] = useState('ASIN');
  const [currentPage, setCurrentPage] = useState(1);
  const [newAsin, setNewAsin] = useState('');
  const [scrapingProviderHasConcurrencyInfo, setScrapingProviderHasConcurrencyInfo] = useState(false);
  const itemsPerPage = 10;

  // Utility Functions
  const [formData, setFormData] = useState({
    domain: 'com',
    ASINs: [],
    maxConcurrentRequests: 1,
    numberOfProductsToCheck: 10,
    strategy: 'breadth-first-start',
    usePagesSkip: false,
    pagesSkip: 5,
    scrapeAllSections: false,
    minRank: 1,
    maxRank: 10000,
    mainCategoryId: "",
  });

  const [mainCategories, setMainCategories] = useState({
    com: [],
    de: [],
  });

  const domains = [
    { value: 'com', label: 'USA (https://www.amazon.com)' },
    { value: 'de', label: 'Germany (https://www.amazon.de)' },
  ];

  const strategies = [
    { value: 'breadth-first-start', label: 'Breadth-first start' },
    { value: 'breadth-first-end', label: 'Breadth-first end' },
    { value: 'depth-first-start', label: 'Depth-first start' },
    { value: 'depth-first-end', label: 'Depth-first end' },
  ];

  // API Calls
  const fetchMainCategories = async () => {
    if (!mainCategories[formData.domain]?.length) {
      const data = await mainCategoriesRequest.request(`${config.apiBaseUrl}/amazon/main-categories?domain=${formData.domain}`);
      if (data.mainCategories?.length) {
        setMainCategories((prev) => ({ ...prev, [formData.domain]: data.mainCategories }));
        setFormData((prev) => ({ ...prev, mainCategoryId: data.mainCategories[0]._id }));
      }
    }
  };

  const checkScrapingProviderStatusApiEndpoint = async () => {
    try {
      const data = await scrapingProviderStatusApiEndpointRequest.request(`${config.apiBaseUrl}/amazon/scraping-providers/concurrency`);
      setScrapingProviderHasConcurrencyInfo(data.currentScrapingProviderHasConcurrencyInfo);
    } catch (error) {

    }
  };

  // Effects
  useEffect(() => {
    if (isOpen) {
      fetchMainCategories();
      checkScrapingProviderStatusApiEndpoint();
    }
  }, [isOpen, formData.domain]);

  useEffect(() => {
    const totalPages = Math.ceil(formData.ASINs.length / itemsPerPage);
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [formData.ASINs, currentPage]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'minRank' && Number(value) > formData.maxRank) return;
    if (name === 'maxRank' && Number(value) < formData.minRank) return;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddAsin = () => {
    const asin = newAsin.trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      alert('Please enter a valid ASIN (10 characters, alphanumeric)');
      return;
    }
    if (formData.ASINs.includes(asin)) {
      alert('This ASIN is already in the list.');
      return;
    }
    setFormData((prev) => {
      const updatedASINs = [...prev.ASINs, asin];
      setCurrentPage(Math.ceil(updatedASINs.length / itemsPerPage));
      return { ...prev, ASINs: updatedASINs };
    });
    setNewAsin('');
  };

  const handleRemoveAsin = (index) => {
    setFormData((prev) => ({
      ...prev,
      ASINs: prev.ASINs.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const processRows = (rows) => {
      if (!rows.length) {
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
        .filter((asin) => /^[A-Z0-9]{10}$/.test(asin));
      setFormData((prev) => {
        const unique = new Set(extractedASINs);
        const newList = Array.from(unique);
        setCurrentPage(Math.ceil(newList.length / itemsPerPage));
        return { ...prev, ASINs: newList };
      });
    };

    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n').map((row) => row.split(','));
        processRows(rows);
      };
      reader.readAsText(file);
    } else if (fileExtension === 'xlsx') {
      reader.onload = (event) => {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        processRows(rows);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Unsupported file format. Please upload a CSV or XLSX file.');
    }
    e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scanData = {
      type: scanType,
      domain: formData.domain,
      maxConcurrentRequests: 1,
    };

    if (scanType === 'ASIN') {
      if (!formData.ASINs.length || !formData.ASINs.every((asin) => /^[A-Z0-9]{10}$/.test(asin))) {
        alert('Please enter at least one valid ASIN (10 characters, alphanumeric).');
        return;
      }
      scanData.ASINs = formData.ASINs;
    } else if (scanType === 'Category') {
      if (Number(formData.numberOfProductsToCheck) < 12) {
        alert('Number of products to gather must be at least 12 for Category scans.');
        return;
      }
      scanData.mainCategoryId = formData.mainCategoryId;
      scanData.strategy = formData.strategy;
      scanData.usePagesSkip = formData.usePagesSkip;
      scanData.pagesSkip = formData.pagesSkip;
      scanData.numberOfProductsToCheck = Number(formData.numberOfProductsToCheck);
      scanData.minRank = Number(formData.minRank);
      scanData.maxRank = Number(formData.maxRank);
    } else if (scanType === 'Deals') {
      if (Number(formData.numberOfProductsToCheck) < 12) {
        alert('Number of products to gather must be at least 12 for Deals scans.');
        return;
      }
      scanData.mainCategoryId = formData.mainCategoryId;
      scanData.numberOfProductsToCheck = Number(formData.numberOfProductsToCheck);
    }

    try {
      await submitRequest.request(`${config.apiBaseUrl}/amazon/scans/enqueue`, 'POST', { config: scanData });
      console.log("Closing");
      onClose();
      setFormData((prev) => ({ ...prev, ASINs: [] }));
    } catch (error) {
      console.log(error);
    }
  };

  // Sub-components
  const SelectInput = ({ label, name, value, onChange, options }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-200">{label}</label>
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const NumberInput = ({ label, name, value, onChange, min, disabled }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-200">{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        disabled={disabled}
        className={`w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );

  const CheckboxInput = ({ label, name, checked, onChange }) => (
    <div className="space-y-1">
      <label className="flex items-center text-sm font-medium text-gray-200">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
        />
        {label}
      </label>
    </div>
  );

  const CategoryAndDealsForm = ({ children }) => (
    <div className="space-y-4">
      <div>
        <SelectInput
          label="Main Category"
          name="mainCategoryId"
          value={formData.mainCategoryId}
          onChange={(e) =>
            setFormData(prev => ({
              ...prev,
              mainCategoryId: mainCategories[formData.domain].find(mainCategory => mainCategory._id === e.target.value)._id,
            }))
          }
          options={mainCategories[formData.domain].map(mainCategory => ({ value: mainCategory._id, label: mainCategory.name, }))}
        />
      </div>
      <div>
        <div className="flex gap-2">
          <div className="flex-1">
            <NumberInput
              label="Min Rank"
              name="minRank"
              value={formData.minRank}
              onChange={handleInputChange}
              min="1"
            />
          </div>
          <div className="flex-1">
            <NumberInput
              label="Max Rank"
              name="maxRank"
              value={formData.maxRank}
              onChange={handleInputChange}
              min="1"
            />
          </div>
        </div>
      </div>
      {children}
    </div>
  );

  const ASINForm = () => {
    const totalPages = formData.ASINs.length ? Math.ceil(formData.ASINs.length / itemsPerPage) : 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentAsins = formData.ASINs.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <label
            htmlFor="fileUpload"
            className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Upload file with ASINs
          </label>
          <input
            id="fileUpload"
            accept=".csv,.xlsx"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, ASINs: [] }))}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Reset
          </button>
        </div>
        <table className="w-full text-white border-collapse">
          <tbody>
            {currentAsins.map((asin, index) => (
              <tr key={startIndex + index} className="border-b border-gray-600">
                <td className="p-2">
                  <span className="block p-1 rounded">{asin}</span>
                </td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveAsin(startIndex + index)}
                    className="p-1 bg-red-600 rounded hover:bg-red-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleAddAsin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add ASIN
          </button>
          <input
            type="text"
            value={newAsin}
            onChange={(e) => setNewAsin(e.target.value)}
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new ASIN"
            maxLength={10}
          />
        </div>
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-white">Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const CategoryForm = () => (
    mainCategories[formData.domain].length ? (
      <CategoryAndDealsForm>
        <SelectInput
          label="Strategy"
          name="strategy"
          value={formData.strategy}
          onChange={handleInputChange}
          options={strategies}
        />
        <CheckboxInput
          label="Use Pages Skipping"
          name="usePagesSkip"
          checked={formData.usePagesSkip}
          onChange={handleInputChange}
        />
        <NumberInput
          label="Pages Skip"
          name="pagesSkip"
          value={formData.pagesSkip}
          onChange={handleInputChange}
          min="1"
          disabled={!formData.usePagesSkip}
        />
        <NumberInput
          label="Number of products to gather"
          name="numberOfProductsToCheck"
          value={formData.numberOfProductsToCheck}
          onChange={handleInputChange}
          min="12"
        />
      </CategoryAndDealsForm>
    ) : (
      <p className="text-red-400">No complete main categories are available for this domain. Please gather categories first.</p>
    )
  );

  const DealsForm = () => (
    mainCategories[formData.domain].length ? (
      <CategoryAndDealsForm>
        <NumberInput
          label="Number of products to gather"
          name="numberOfProductsToCheck"
          value={formData.numberOfProductsToCheck}
          onChange={handleInputChange}
          min="10"
        />
      </CategoryAndDealsForm>
    ) : (
      <p className="text-red-400">No complete main categories are available for this domain. Please gather categories first.</p>
    )
  );

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
          {/* First select */}
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

          {/* Second select */}
          <div>
            <SelectInput
              label="Domain"
              name="domain"
              value={formData.domain}
              onChange={handleInputChange}
              options={domains}
            />
          </div>

          {/* Full-width NumberInput on next row */}
          {!scrapingProviderHasConcurrencyInfo && (
            <div className="col-span-2">
              <NumberInput
                label="Max Concurrent Requests"
                name="maxConcurrentRequests"
                value={formData.maxConcurrentRequests}
                onChange={handleInputChange}
                min="1"
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
          {scanType === 'ASIN' && <ASINForm />}
          {scanType === 'Category' && <CategoryForm />}
          {scanType === 'Deals' && <DealsForm />}
          <button
            type="submit"
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 hover:cursor-pointer transition disabled:bg-gray-400"
            disabled={submitRequest.loading}
          >
            Start Scan
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewScanModal;