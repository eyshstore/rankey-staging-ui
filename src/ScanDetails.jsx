import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

import useRequest from '../hooks/useRequest.hook';
import config from './config';

const ScanDetails = ({ scans, currentScanId, setFetchDetailsCallback }) => {
  const scanDetailsRequest = useRequest();
  const [scanDetails, setScanDetails] = useState(null);
  const intervalRef = useRef(null);

  if (!currentScanId) {
    return;
  }

  // Fetch scan details when currentScan changes
  const fetchDetails = async () => {
    if (!currentScanId) return;

    try {
      const response = await scanDetailsRequest.request(`${config.apiBaseUrl}/amazon/scans/${currentScanId}/details`);
      console.log(`Fetching details for ${currentScanId}: ${JSON.stringify(response.details, null, 2)}`);
      setScanDetails(response.details);
    } catch (error) {
      console.error(`ScanDetails error: ${error}`);
    }
  };

  useEffect(() => {
    if (currentScanId) {
      setFetchDetailsCallback(() => fetchDetails);
    } else {
      setFetchDetailsCallback(null);
    }
  }, [currentScanId]);

  useEffect(() => {
    if (currentScanId) {
      fetchDetails();
    } else {
      setScanDetails(null);
    }
  }, [currentScanId]);

  useEffect(() => {
    const scan = scans.find(scan => scan._id === currentScanId);
    if (scan?.state === 'active') {
      intervalRef.current = setInterval(() => {
        fetchDetails();
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentScanId, scans]);

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
        `${config.apiBaseUrl}/amazon/scans/${currentScanId}/result`
      );

      console.log(response);

      if (!response || !response.products) {
        console.error('No products found in response');
        return;
      }

      const workbook = XLSX.utils.book_new();  // Initialize workbook at the start

      // ===== Categories sheet (if present) =====
      if (Array.isArray(response.categories) && response.categories.length > 0) {
        console.log("Writing categories...");
        const categoryData = response.categories.map((cat) => ({
          name: cat.name,
          nodeId: cat.nodeId,
          page: cat.page,
          domain: cat.domain,
          sentRequests: cat.sentRequests,
          status: cat.status,
          requestedAt: new Date(cat.requestedAt).toISOString(),
          receivedAt: new Date(cat.receivedAt).toISOString(),
          ASINs: cat.ASINs ? cat.ASINs.join(', ') : [],
          link: `https://www.amazon.${cat.domain}/s?rh=n:${cat.nodeId}&fs=true&page=${cat.page}`,
        }));

        const categoryFields = [
          'name',
          'nodeId',
          'page',
          'domain',
          'sentRequests',
          'status',
          'requestedAt',
          'receivedAt',
          'proxyCountry',
          'ASINs',
          'link', // ⬅️ Add this
        ];

        const categoriesSheet = XLSX.utils.json_to_sheet(categoryData, { header: categoryFields });
        XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');
      }

      // ===== Products sheet =====
      const fields = [
        'ASIN', 'domain', 'status', 'proxyCountry', 'sentRequests', 'requestedAt',
        'receivedAt', 'title', 'price', 'category', 'isPrime', 'brand', 'rank',
        'availabilityQuantity', 'availabilityStatus', 'color', 'size', 'dateFirstAvailable',
        'discountCoupon', 'ratingStars', 'purchaseInfo', 'changedInThisScan', 'changedFields', 'link'
      ];

      const data = response.products.map(product => {
        const row = {};
        fields.forEach(field => {
          row[field] = product[field] !== undefined ? product[field] : '';
        });
      
        // Add link to product page
        row.link = product.domain ? `https://www.amazon.${product.domain}/dp/${product.ASIN}` : "";
      
        return row;
      });

      const productsSheet = XLSX.utils.json_to_sheet(data, { header: fields });
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

      // ===== Write file =====
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scan_${currentScanId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading products:', error);
    }
  };


  if (!currentScanId) {
    return <p className="p-4 text-gray-500">No scan selected</p>;
  }

  if (!scanDetails && scanDetailsRequest.loading) {
    return <p className="p-4 text-gray-500">Loading...</p>;
  }

  let detailsDisplay;
  if (scanDetails) {
    const scan = scans.find(scan => scan._id == currentScanId);

    switch (scan.type) {
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
              {scanDetails.sentRequests !== undefined && (
                <p>
                  <strong>Sent Requests: </strong>
                  {scanDetails.sentRequests}
                </p>
              )}
              {scanDetails.productsGathered !== undefined && (
                <p>
                  <strong>Products Gathered: </strong>
                  {scanDetails.productsGathered + (scanDetails.numberOfProductsToGather !== undefined ? ` / ${scanDetails.numberOfProductsToGather}` : "")}
                </p>
              )}

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
              {scanDetails.sentRequests !== undefined && (
                <p>
                  <strong>Sent Requests: </strong>
                  {scanDetails.sentRequests}
                </p>
              )}
              {scanDetails.productsGathered !== undefined && (
                <p>
                  <strong>Products Gathered: </strong>
                  {scanDetails.productsGathered}
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

            <div className="w-1/2">
              {scanDetails.mainCategoryName !== undefined && (
                <p>
                  <strong>Main Category: </strong>
                  {scanDetails.mainCategoryName}
                </p>
              )}
              {scanDetails.minRank !== undefined && scanDetails.maxRank !== undefined && (
                <p>
                  <strong>Rank Range: </strong>
                  {`${scanDetails.minRank} - ${scanDetails.maxRank}`}
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
    Category Scan ${currentScanId}
  
    --- Category Stats ---
    Requests Sent: ${scanDetails.categoryPagessentRequests}
    Unique Products Found: ${scanDetails.uniqueProductsFound}
  
    --- Product Stats ---
    Requests Sent: ${scanDetails.productPagessentRequests}
    Products Queue Length: ${scanDetails.productsQueueLength}
    Products Gathered: ${scanDetails.productsGathered}
  
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
          Scan {currentScanId}
          <button
            onClick={handleProductsDownload}
            className="ml-2 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={scanDetailsRequest.loading || !currentScanId}
          >
            Products
          </button>
        </h2>
      </div>
      <div className="flex-1 flex-col p-4">
        <button
          onClick={handleCopyDetails}
          className="mb-4 cursor-pointer px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
          disabled={scanDetailsRequest.loading || !currentScanId}
        >
          Copy Details
        </button>
        {detailsDisplay}
      </div>
    </div>
  );
};

export default ScanDetails;