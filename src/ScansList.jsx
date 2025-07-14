import { React, useState, useEffect } from 'react';

import config from './config';

import useRequest from '../hooks/useRequest.hook';

const ScansList = ({ currentScanId, setCurrentScanId }) => {
  const [scans, setScans] = useState([]);
  const scansRequest = useRequest();

  const fetchScans = async () => {
    const response = await scansRequest.request(`${config.apiBaseUrl}/amazon/scans`);
    setScans(response.scans);
  };

  const handleScanDelete = async (scanId) => {
    await scansRequest.request(`${config.apiBaseUrl}/amazon/delete-scan?_id=${scanId}`, { method: "DELETE" });
  };

  useEffect(() => {
    fetchScans();

    // Further updates from server
    const eventSource = new EventSource(`${config.apiBaseUrl}/amazon/scans-list/events`, { withCredentials: true });
    eventSource.onmessage = (event) => {
      console.log(`Scans: ${JSON.stringify(event.data, null, 2)}`);
      setScans(JSON.parse(event.data))
    };
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [])

  const scanStyle = "border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";
  const selectedScanStyle = "bg-indigo-400 border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";

  let scansDisplay;
  if (scans.length) {
    scansDisplay = scans.map((entry) => {
      let stateControls;
      switch (entry.state) {
        case "enqueued":
          stateControls = (
            <button onClick={event => { event.stopPropagation(); handleScanDelete(entry._id); }} className=" bg-red-600 hover:bg-red-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          );
          break;
        case "active":
          stateControls = (
            <>
              <button className=" bg-green-600 hover:bg-green-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
              </button>
              <button className=" bg-red-600 hover:bg-red-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                </svg>
              </button>
            </>
          );
          break;
        case "stalled":
          stateControls = (
            <button className=" bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          );
          break;
        case "paused":
          stateControls = (
            <button className=" bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            </button>
          );
          break;
        case "completed":
            stateControls = (
              <button className=" bg-red-600 hover:bg-indigo-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10" onClick={() => handleScanDelete(entry._id)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            );
            break;
      }

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}.${month}.${day} ${hours}:${minutes}`;
      };

      const capitalize = string => {
        if (!string) return string;
        return string.charAt(0).toUpperCase() + string.slice(1);
      };

      return (
        <tr
          onClick={() => setCurrentScanId(entry._id)}
          key={entry._id}
          className={currentScanId === entry._id ? selectedScanStyle : scanStyle}
        >
          <td className="p-4">{ entry._id.slice(0, 8) + "..." }</td>
          <td className="p-4">{entry.type}</td>
          <td className="p-4">{ capitalize(entry.state) }</td>
          <td className="p-4">{entry.domain}</td>
          <td className="p-4">{ `${entry.minRank} - ${entry.maxRank}` }</td>
          <td className="p-4">{ formatDate(new Date(entry.productExpiration)) }</td>
          <td className="p-4 text-center">{stateControls}</td>
        </tr>
      );
    });
  } else {
    scansDisplay = (
      <tr>
        <td colSpan={5} className="p-4 text-center">
          No scans available
        </td>
      </tr>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="p-4 text-left border-b border-white">Id</th>
          <th className="p-4 text-left border-b border-white">Type</th>
          <th className="p-4 text-left border-b border-white">State</th>
          <th className="p-4 text-left border-b border-white">Domain</th>
          <th className="p-4 text-left border-b border-white">Rank Range</th>
          <th className="p-4 text-left border-b border-white">Product Expiration</th>
          <th className="p-4 text-left border-b border-white"></th>
        </tr>
      </thead>
      <tbody>
        {scansDisplay}
      </tbody>
    </table>
  );
};

export default ScansList;