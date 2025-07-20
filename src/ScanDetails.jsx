import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import useRequest from '../hooks/useRequest.hook';
import config from './config';

const ScanDetails = ({ currentScanId }) => {
  const [scanId, setScanId] = useState("");
  const scanDetailsRequest = useRequest();

  /*
  const fetchScanDetails = async () => {
    try {
      const response = await scanDetailsRequest.request(`${config.apiBaseUrl}/amazon/scan-details`);
      if (response && response.scan && response.scan._id) {
        setScanId(response.scan._id);
      } else {
        console.error('No scan ID found in response');
      }
    } catch (error) {
      console.error('Error fetching scan details:', error);
    }
  };

  
  useEffect(() => {
    fetchScanDetails();

    if (currentScanId && currentScanId === scanId) {
      const eventSource = new EventSource(`${config.apiBaseUrl}/amazon/scan-details/events`, { withCredentials: true });
      eventSource.onmessage = (event) => {
        console.log(`Scan Event: ${JSON.stringify(JSON.parse(event.data), null, 2)}`);
      };
      eventSource.onerror = () => {
        console.error('SSE error occurred');
        eventSource.close();
      };
      return () => eventSource.close();
    }
  }, [currentScanId, scanId]);
  */

  // Handle downloading products as Excel
  const handleProductsDownload = async () => {
    try {
      const response = await scanDetailsRequest.request(`${config.apiBaseUrl}/amazon/${currentScanId}/products`);
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
        'changedFields'
      ];

      // Map products to ensure all fields are included
      console.log(JSON.stringify(response.products, null, 2));
      const data = response.products.map(product => {
        const row = {};
        fields.forEach(field => {
          row[field] = product[field] !== undefined ? product[field] : '';
        });
        return row;
      });

      // Create Excel worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      // Set column headers
      XLSX.utils.sheet_add_aoa(worksheet, [fields], { origin: 'A1' });

      // Generate and download Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scan_${currentScanId}_products.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading products:', error);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded">
      {scanDetailsRequest.loading && <p>Loading...</p>}
      {scanDetailsRequest.error && <p className="text-red-500">Error: {scanDetailsRequest.error}</p>}
      <h2 className="text-lg font-bold mb-2">Scan Details</h2>
      <button
        onClick={handleProductsDownload}
        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        disabled={scanDetailsRequest.loading || !currentScanId}
      >
        Download Products
      </button>
    </div>
  );
};

export default ScanDetails;