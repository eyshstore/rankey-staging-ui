import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

import useRequest from '../hooks/useRequest.hook';
import config from './config';

const ScanDetails = ({ currentScan }) => {
  const scanDetailsRequest = useRequest();
  const [dbInfo, setDbInfo] = useState(null);
  const [realTimeInfo, setRealTimeInfo] = useState(null);

  // Fetch scan details when currentScan changes
  const fetchData = async () => {
    if (!currentScan?._id) return;

    try {
      setDbInfo(null); // Reset to avoid showing stale data
      setRealTimeInfo(null);
      const response = await scanDetailsRequest.request(`${config.apiBaseUrl}/amazon/scans/${currentScan._id}/details`);
      setDbInfo(response.dbInfo);
      setRealTimeInfo(response.realTimeInfo);
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
      const { scanId, dbInfo, realTimeInfo } = JSON.parse(event.data);
      if (currentScan._id === scanId) {
        // setRealTimeInfo(realTimeInfo);
        console.log(realTimeInfo);
      }
    };
    eventSource.onerror = () => {
      console.error('EventSource error');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [currentScan?._id]); // Depend on currentScan._id to refetch on change

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
  switch (currentScan.type) {
    case 'ASIN':
      detailsDisplay = (
        <div>
          {dbInfo && (
            <>
              <p><strong>Products Gathered:</strong> {dbInfo.productsCount} / {dbInfo.numberOfProductsToCheck}</p>
              {
                typeof realTimeInfo === 'string' ? realTimeInfo : 
                  ASINsRequests.map((ASIN, i) => <p>{ `${i + 1}. ${ASIN}` }</p>)
              }
            </>
          )}
        </div>
      );
      break;
    case 'Category':
      break;
    case 'Deals':
      break;
    default:
      detailsDisplay = <p>Unknown scan type</p>;
  }

  return (
    <div>
      <div className="bg-gray-800 p-4 rounded">
        {scanDetailsRequest.error && <p className="text-red-500">Error: {scanDetailsRequest.error}</p>}
        <h2 className="text-lg font-bold mb-2">Scan {currentScan._id}</h2>
      </div>
      <div className="flex-1 flex-col p-4">
        <button
          onClick={handleProductsDownload}
          className="mb-4 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          disabled={scanDetailsRequest.loading || !currentScan._id}
        >
          Download Products
        </button>
        {detailsDisplay}
      </div>
    </div>
  );
};

export default ScanDetails;