import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

import useRequest from '../hooks/useRequest.hook';
import config from './config';

const ScanDetails = ({ currentScan }) => {
  const scanDetailsRequest = useRequest();
  const [scanDetails, setScanDetails] = useState(null);

  if (!currentScan) {
    return;
  }

  // Fetch scan details when currentScan changes
  const fetchData = async () => {
    if (!currentScan?._id) return;
    console.log(`Fetching data for: ${currentScan._id}`);

    try {
      setScanDetails(null);
      const response = await scanDetailsRequest.request(`${config.apiBaseUrl}/amazon/scans/${currentScan._id}/details`);
      console.log(response.details);
      setScanDetails(response.details);
    } catch (error) {
      console.error(`ScanDetails error: ${error}`);
    }
  };

  useEffect(() => {
    fetchData();

    // Establish EventSource for real-time updates
    if (!currentScan?._id) return;

    const eventSource = new EventSource(`${config.apiBaseUrl}/amazon/scan-details/events`, { withCredentials: true });
    eventSource.onmessage = (event) => {
      const { scanId, details } = JSON.parse(event.data);
      if (currentScan._id === scanId) {
        setScanDetails(details);
      }
    };
    eventSource.onerror = () => {
      console.error('EventSource error');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [currentScan?._id]); // Depend on currentScan._id to refetch on change

  function formatDateTime(date) {
    const pad = (n) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Months are 0-indexed
    const day = pad(date.getDate());

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  }

  const handleProductsDownload = async () => {
    try {
      const response = await scanDetailsRequest.request(`${config.apiBaseUrl}/amazon/scans/${currentScan._id}/products`);
      if (!response || !response.products) {
        console.error('No products found in response');
        return;
      }

      const fields = [
        'ASIN',
        'domain',
        'title',
        'price',
        'category',
        'isPrime',
        'brand',
        'rank',
        'availabilityQuantity',
        'availabilityStatus',
        'color',
        'size',
        'dateFirstAvailable',
        'discountCoupon',
        'ratingStars',
        'purchaseInfo',
        'changedInThisScan',
        'changedFields',
        'status',
      ];

      const data = response.products.map(product => {
        const row = {};
        fields.forEach(field => {
          row[field] = product[field] !== undefined ? product[field] : '';
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.utils.sheet_add_aoa(worksheet, [fields], { origin: 'A1' });

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scan_${currentScan._id}_products.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading products:', error);
    }
  };

  if (!currentScan) {
    return <p className="p-4 text-gray-500">No scan selected</p>;
  }

  if (scanDetailsRequest.loading) {
    return <p className="p-4 text-gray-500">Loading...</p>;
  }

  let detailsDisplay;
  if (scanDetails) {
    switch (currentScan.type) {
      case 'ASIN':
        /*
        [Only Real-Time]
        1. Current Product Pages Requests (url)

        [Persistent Real-time]
        1. Requests Sent
        2. Requests Succeeded
        3. Products Gathered / Products To Gather
        */
        detailsDisplay = (
          <div>
            <>
              <p><strong>Created: </strong>{formatDateTime(new Date(scanDetails.createdAt))}</p>
              {scanDetails.startedAt && <p><strong>Started: </strong>{formatDateTime(new Date(scanDetails.startedAt))}</p>}
              {scanDetails.completedAt && <p><strong>Completed: </strong>{formatDateTime(new Date(scanDetails.completedAt))}</p>}
              <p>
                <strong>Products Gathered: {scanDetails.productsCount}</strong>
              </p>
              <p>
                <strong>Requests sent:</strong> {scanDetails.requestsSent}
              </p>

              {scanDetails.ASINsRequests?.length > 0 && (
                <>
                  <p>Current product pages requests: </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {scanDetails.ASINsRequests.map((ASIN, i) => (
                      <div
                        key={ASIN}
                        className="p-1 rounded-xl shadow text-white-800 text-sm"
                      >
                        {`${i + 1}. ${ASIN}`}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          </div>
        );
        break;
      case "Category":
        /*
        [Only Real-Time]
        1. Current Product Pages Requests (url)
        2. Current Category Pages Requests (url)

        [Persistent Real-time]
        1. Category Pages Requests Sent
        2. Category Pages Succeeded
        3. Unique Products Found

        4. Product Pages Requests Sent
        5. Product Pages Requests Succeeded
        6. Products Gathered
        */
        detailsDisplay = (
          <div className="flex gap-6">
            {/* Left column: Category requests */}
            <div className="w-1/2">
              <p>
                <strong>Created: </strong>{formatDateTime(new Date(scanDetails.createdAt))}
              </p>
              {scanDetails.startedAt && <p><strong>Started: </strong> {formatDateTime(new Date(scanDetails.startedAt))}</p>}
              {scanDetails.completedAt && <p><strong>Completed: </strong> {formatDateTime(new Date(scanDetails.completedAt))}</p>}
              <p>
                <strong>Category Requests Sent: </strong> {scanDetails.categoryPagesRequestsSent}
              </p>
              <p>
                <strong>Category Requests Failed: </strong> {scanDetails.categoryPagesRequestsFailed}
              </p>
              <p>
                <strong>Unique Products Found: </strong> {scanDetails.uniqueProductsFound}
              </p>

              {scanDetails.categoryPagesBeingRequested?.length > 0 && (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold mb-1">Active Category Requests</h3>
                  <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-2 space-y-1 bg-gray-800">
                    {scanDetails.categoryPagesBeingRequested.map((category, i) => (
                      <div
                        key={`${category.name}-${category.page}`}
                        className="p-2 bg-gray-700 rounded text-xs"
                      >
                        {`${i + 1}. ${category.name}, Page: ${category.page}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Product requests */}
            <div className="w-1/2">
              <p>
                <strong>Product Requests Sent: </strong> {scanDetails.productPagesRequestsSent}
              </p>
              <p>
                <strong>Product Requests Failed: </strong> {scanDetails.productPagesRequestsFailed}
              </p>
              <p>
                <strong>Products Queue Length: </strong> {scanDetails.productsQueueLength}
              </p>
              <p>
                <strong>Products Gathered: </strong> {scanDetails.productsCount}
              </p>

              {scanDetails.productASINsBeingRequested?.length > 0 && (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold mb-1">Active Product Requests</h3>
                  <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-2 space-y-1 bg-gray-800">
                    {scanDetails.productASINsBeingRequested.map((ASIN, i) => (
                      <div
                        key={ASIN}
                        className="p-2 bg-gray-700 rounded text-xs"
                      >
                        {`${i + 1}. ${ASIN}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        break;
      case "Deals":
        break;
      default:
        detailsDisplay = <p>Unknown scan type</p>;
    }
  }

  const handleCopyDetails = () => {
    if (!scanDetails) return;

    // Build a plain text representation
    const copyText = `
    Category Scan ${currentScan._id}
  
    --- Category Stats ---
    Requests Sent: ${scanDetails.categoryPagesRequestsSent}
    Requests Failed: ${scanDetails.categoryPagesRequestsFailed}
    Unique Products Found: ${scanDetails.uniqueProductsFound}
  
    --- Product Stats ---
    Requests Sent: ${scanDetails.productPagesRequestsSent}
    Requests Failed: ${scanDetails.productPagesRequestsFailed}
    Products Queue Length: ${scanDetails.productsQueueLength}
    Products Gathered: ${scanDetails.productsCount}
  
    --- Active Category Requests ---
    ${scanDetails.categoryPagesBeingRequested?.map(
      (c, i) => `${i + 1}. ${c.name}, Page: ${c.page}`
    ).join("\n") || "None"}
  
    --- Active Product Requests ---
    ${scanDetails.productASINsBeingRequested?.map(
      (asin, i) => `${i + 1}. ${asin}`
    ).join("\n") || "None"}
    `;

    navigator.clipboard.writeText(copyText.trim()).then(
      () => alert("Details copied to clipboard ✅"),
      (err) => console.error("Copy failed: ", err)
    );
  }

  return (
    <div>
      <div className="bg-gray-800 p-4 rounded">
        {scanDetailsRequest.error && <p className="text-red-500">Error: {scanDetailsRequest.error}</p>}
        <h2 className="text-lg font-bold mb-2">
          Scan {currentScan._id}
          <button
            onClick={handleProductsDownload}
            className="ml-2 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={scanDetailsRequest.loading || !currentScan._id}
          >
            Products
          </button>
        </h2>
      </div>
      <div className="flex-1 flex-col p-4">
        <button
          onClick={handleCopyDetails}
          className="mb-4 cursor-pointer px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
          disabled={scanDetailsRequest.loading || !currentScan._id}
        >
          Copy Details
        </button>
        {detailsDisplay}
      </div>
    </div>
  );
};

export default ScanDetails;
