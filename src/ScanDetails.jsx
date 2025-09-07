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
      const response = await scanDetailsRequest.request(
        `${config.apiBaseUrl}/amazon/scans/${currentScan._id}/products`
      );
      console.log("---PRODUCTS---");
      console.log(response.products);
  
      if (!response || !response.products) {
        console.error('No products found in response');
        return;
      }
  
      // Replace createdAt → foundAt
      const fields = [
        'ASIN',
        'domain',
        'proxyCountry',
        'foundAt',  // ✅ new field
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
  
      // ===== Products sheet =====
      const data = response.products.map(product => {
        const row = {};
        fields.forEach(field => {
          if (field === 'foundAt') {
            // Format foundAt as ISO string for Excel readability
            row[field] = product.foundAt
              ? new Date(product.foundAt).toISOString()
              : '';
          } else {
            row[field] = product[field] !== undefined ? product[field] : '';
          }
        });
        return row;
      });
  
      const workbook = XLSX.utils.book_new();
      const productsSheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
      XLSX.utils.sheet_add_aoa(productsSheet, [fields], { origin: 'A1' });
  
      // ===== Summary sheet (if present) =====
      if (response.summary) {
        const summaryEntries = Object.entries(response.summary).flatMap(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return Object.entries(value).map(([subKey, subVal]) => ({
              Metric: `${key}.${subKey}`,
              Value: subVal,
            }));
          }
          return { Metric: key, Value: value };
        });
  
        const summarySheet = XLSX.utils.json_to_sheet(summaryEntries);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        XLSX.utils.sheet_add_aoa(summarySheet, [['Metric', 'Value']], { origin: 'A1' });
      }
  
      // ===== Write file =====
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
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
      case "ASIN":
        detailsDisplay = (
          <div>
            <>
              {scanDetails.createdAt && (
                <p>
                  <strong>Created: </strong>
                  {formatDateTime(new Date(scanDetails.createdAt))}
                </p>
              )}
              {scanDetails.startedAt && (
                <p>
                  <strong>Started: </strong>
                  {formatDateTime(new Date(scanDetails.startedAt))}
                </p>
              )}
              {scanDetails.completedAt && (
                <p>
                  <strong>Completed: </strong>
                  {formatDateTime(new Date(scanDetails.completedAt))}
                </p>
              )}
              {scanDetails.productsCount !== undefined && (
                <p>
                  <strong>Products Gathered: </strong>
                  {scanDetails.productsCount}
                </p>
              )}
              {scanDetails.requestsSent !== undefined && (
                <p>
                  <strong>Requests Sent: </strong>
                  {scanDetails.requestsSent}
                </p>
              )}
              {
                scanDetails.productPagesRequestsSucceeded !== undefined && (
                  <p>
                    <strong>Requests Succeeded: </strong>
                    {scanDetails.productPagesRequestsSucceeded}
                  </p>
                )
              }

              {Array.isArray(scanDetails.ASINsRequests) &&
                scanDetails.ASINsRequests.length > 0 && (
                  <>
                    <p>Current Product Pages Requests:</p>
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
        detailsDisplay = (
          <div className="flex gap-6 text-sm">
            {/* Left column: Category requests */}
            <div className="w-1/2">
              {scanDetails.createdAt && (
                <p>
                  <strong>Created: </strong>
                  {formatDateTime(new Date(scanDetails.createdAt))}
                </p>
              )}
              {scanDetails.startedAt && (
                <p>
                  <strong>Started: </strong>
                  {formatDateTime(new Date(scanDetails.startedAt))}
                </p>
              )}
              {scanDetails.completedAt && (
                <p>
                  <strong>Completed: </strong>
                  {formatDateTime(new Date(scanDetails.completedAt))}
                </p>
              )}
              {scanDetails.categoryPagesRequestsSent !== undefined && (
                <p>
                  <strong>Category Requests Sent: </strong>
                  {scanDetails.categoryPagesRequestsSent}
                </p>
              )}
              {scanDetails.categoryPagesRequestsSucceeded !== undefined && (
                <p>
                  <strong>Category Requests Succeeded: </strong>
                  {scanDetails.categoryPagesRequestsSucceeded}
                </p>
              )}
              {scanDetails.uniqueProductsFound !== undefined && (
                <p>
                  <strong>Unique Products Found: </strong>
                  {scanDetails.uniqueProductsFound}
                </p>
              )}

              {Array.isArray(scanDetails.categoryPagesBeingRequested) &&
                scanDetails.categoryPagesBeingRequested.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold mb-1">
                      Active Category Requests
                    </h3>
                    <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-2 space-y-1 bg-gray-800">
                      {scanDetails.categoryPagesBeingRequested.map(
                        (category, i) => (
                          <div
                            key={`${category.name}-${category.page}`}
                            className="p-2 bg-gray-700 rounded text-xs"
                          >
                            {`${i + 1}. ${category.name}, Page: ${category.page}`}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Right column: Product requests */}
            <div className="w-1/2">
              {scanDetails.productPagesRequestsSent !== undefined && (
                <p>
                  <strong>Product Requests Sent: </strong>
                  {scanDetails.productPagesRequestsSent}
                </p>
              )}
              {scanDetails.productPagesRequestsSucceeded !== undefined && (
                <p>
                  <strong>Product Requests Succeeded: </strong>
                  {scanDetails.productPagesRequestsSucceeded}
                </p>
              )}
              {scanDetails.productsQueueLength !== undefined && (
                <p>
                  <strong>Products Queue Length: </strong>
                  {scanDetails.productsQueueLength}
                </p>
              )}
              {scanDetails.productsCount !== undefined && (
                <p>
                  <strong>Products Gathered: </strong>
                  {scanDetails.productsCount}
                </p>
              )}

              {Array.isArray(scanDetails.productASINsBeingRequested) &&
                scanDetails.productASINsBeingRequested.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold mb-1">
                      Active Product Requests
                    </h3>
                    <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-2 space-y-1 bg-gray-800">
                      {scanDetails.productASINsBeingRequested.map((ASIN, i) => (
                        <div key={ASIN} className="p-2 bg-gray-700 rounded text-xs">
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
    Requests Succeeded: ${scanDetails.categoryPagesRequestsSucceeded}
    Unique Products Found: ${scanDetails.uniqueProductsFound}
  
    --- Product Stats ---
    Requests Sent: ${scanDetails.productPagesRequestsSent}
    Requests Succeeded: ${scanDetails.productPagesRequestsSucceeded}
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
