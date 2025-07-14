import { React, useState, useEffect } from 'react';

import useRequest from '../hooks/useRequest.hook';
import config from './config';

const ScanDetails = ({ currentScanId }) => {
  const [scanId, setScanId] = useState("");
  const scanDetailsRequest = useRequest();

  const fetchScanDetails = async () => {
    const response = await scanDetailsRequest.request(`${config.apiBaseUrl}/amazon/scan-details`);
    setScanId(response.scan._id);
  };

  useEffect(() => {
    if (scanId == currentScanId) {
      const eventSource = new EventSource(`${config.apiBaseUrl}/amazon/scan/events`, { withCredentials: true });
      eventSource.onmessage = (event) => {
        console.log(`Scan: ${JSON.stringify(event.data, null, 2)}`);
      };
      eventSource.onerror = () => eventSource.close();
      return () => eventSource.close();
    }
  }, [scanId]);

  if (fetchScanDetails.loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h2 className="text-lg font-bold mb-2">Scan Details</h2>
      <table className="border-collapse">
        <tbody>
          <tr>
            <td className="p-2 border-b border-white font-medium">ID</td>
            <td className="p-2 border-b border-white">2G12G1G2</td>
          </tr>
          <tr>
            <td className="p-2 border-b border-white font-medium">Type</td>
            <td className="p-2 border-b border-white">23H23H</td>
          </tr>
          <tr>
            <td className="p-2 border-b border-white font-medium">Region</td>
            <td className="p-2 border-b border-white">32H32H</td>
          </tr>
          <tr>
            <td className="p-2 border-b border-white font-medium">Category</td>
            <td className="p-2 border-b border-white">23H23H23H</td>
          </tr>
          <tr>
            <td className="p-2 border-b border-white font-medium">Rank Range</td>
            <td className="p-2 border-b border-white">23H23H</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ScanDetails;