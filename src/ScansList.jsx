import { React, useState, useEffect } from 'react';
import config from './config';
import useRequest from '../hooks/useRequest.hook';

// Icons remain unchanged
const DeleteIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
};

const HaltIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
    </svg>
  );
};

const ResumeIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
    </svg>
  );
};


const ScansList = ({ scans, setScans, currentScan, setCurrentScan }) => {
  const scansRequest = useRequest();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchScans = async (pageToFetch = page) => {
    const response = await scansRequest.request(
      `${config.apiBaseUrl}/amazon/scans?page=${pageToFetch}`
    );
    console.log(response);
    setScans(response.scans);
    setTotalPages(response.totalPages);
  };

  const handleScanDelete = async (scanId, e) => {
    e.stopPropagation();
    await scansRequest.request(`${config.apiBaseUrl}/amazon/scans?scanId=${scanId}`, "DELETE");
    if (currentScan && scanId === currentScan._id) {
      setCurrentScan(null);
    }
    await fetchScans(page); // reload current page
  };

  const handleDeleteAll = async (event) => {
    event.stopPropagation();
    await scansRequest.request(`${config.apiBaseUrl}/amazon/scans/all`, "DELETE");
    setPage(1); // reset to first page
    await fetchScans(1);
  };

  const handleScanHalt = async (e) => {
    e.stopPropagation();
    await scansRequest.request(`${config.apiBaseUrl}/amazon/scans/halt`, "POST");
    await fetchScans(page);
  };

  const handleScanResume = async (e) => {
    e.stopPropagation();
    await scansRequest.request(`${config.apiBaseUrl}/amazon/scans/resume`, "POST");
    await fetchScans(page);
  };

  useEffect(() => {
    console.log(`Requesting page: ${page}`);
    fetchScans(page);
  }, [page]);
  
  // SSE connection (only once)
  useEffect(() => {
    const eventSource = new EventSource(`${config.apiBaseUrl}/amazon/scans-list/events`, { withCredentials: true });
    eventSource.onmessage = () => {
      console.log(`RECEIVED AN UPDATE...`);
      fetchScans(page);
    };
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, []);

  // Styles remain unchanged
  const scanStyle = "border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";
  const activeScanStyle = "bg-green-800 border-b border-indigo-200 hover:bg-indigo-800 hover:cursor-pointer";
  const selectedScanStyle = "bg-indigo-400 border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";

  let scansDisplay;
  if (scans.length) {
    scansDisplay = scans.map((entry) => {
      let stateControls;
      switch (entry.state) {
        case "enqueued":
          stateControls = (
            <button
              onClick={(e) => handleScanDelete(entry._id, e)}
              className="hover:cursor-pointer bg-red-600 hover:bg-red-800 text-white p-2 rounded flex items-center justify-center w-10 h-10"
              title="Delete Scan"
              disabled={scansRequest.loading}
            >
              <DeleteIcon />
            </button>
          );
          break;
        case "active":
          stateControls = (
            <button
              onClick={handleScanHalt}
              className="hover:cursor-pointer bg-red-600 hover:bg-red-800 text-white p-2 rounded flex items-center justify-center w-10 h-10"
              title="Stop Scan"
              disabled={scansRequest.loading}
            >
              <HaltIcon />
            </button>
          );
          break;
        case "stalled":
          stateControls = (
            <div className="flex gap-2">
              <button
                onClick={handleScanResume}
                className="hover:cursor-pointer bg-green-600 hover:bg-green-800 text-white p-2 rounded flex items-center justify-center w-10 h-10"
                title="Resume Scan"
                disabled={scansRequest.loading}
              >
                <ResumeIcon />
              </button>
              <button
                onClick={handleScanHalt}
                className="hover:cursor-pointer bg-red-600 hover:bg-red-800 text-white p-2 rounded flex items-center justify-center w-10 h-10"
                title="Stop Scan"
                disabled={scansRequest.loading}
              >
                <HaltIcon />
              </button>
            </div>
          );
          break;
        case "completed":
          stateControls = (
            <button
              onClick={(e) => handleScanDelete(entry._id, e)}
              className="hover:cursor-pointer bg-red-600 hover:bg-red-800 text-white p-2 rounded flex items-center justify-center w-10 h-10"
              title="Delete Scan"
              disabled={scansRequest.loading}
            >
              <DeleteIcon />
            </button>
          );
          break;
        default:
          stateControls = (
            <div role="status">
              <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101">
                <path d="M100 50.5908C100 78.2051 ..." fill="currentColor" />
              </svg>
            </div>
          );
      }

      const capitalize = (string) => string ? string.charAt(0).toUpperCase() + string.slice(1) : string;

      let styleClass;
      if (entry.state === "active") {
        styleClass = activeScanStyle;
      } else if (currentScan && currentScan._id === entry._id) {
        styleClass = selectedScanStyle;
      } else {
        styleClass = scanStyle;
      }

      return (
        <tr
          onClick={() => setCurrentScan(entry)}
          key={entry._id}
          className={styleClass}
        >
          <td className="p-4">{"..." + entry._id.slice(-4)}</td>
          <td className="p-4">{entry.type}</td>
          <td className="p-4">{capitalize(entry.state)}</td>
          <td className="p-4">{entry.domain}</td>
          <td className="p-4">{entry.numberOfProductsToCheck}</td>
          <td className="p-4">{entry.mainCategory ? entry.mainCategory.name : "-"}</td>
          <td className="p-4">{entry.minRank && entry.maxRank ? `${entry.minRank} - ${entry.maxRank}` : "-"}</td>
          <td className="p-4 text-center">{stateControls}</td>
        </tr>
      );
    });
  } else {
    scansDisplay = (
      <tr>
        <td colSpan={8} className="p-4 text-center">
          No scans available
        </td>
      </tr>
    );
  }

  return (
    <>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-4 text-left border-b border-white">Id</th>
            <th className="p-4 text-left border-b border-white">Type</th>
            <th className="p-4 text-left border-b border-white">State</th>
            <th className="p-4 text-left border-b border-white">Domain</th>
            <th className="p-4 text-left border-b border-white">Products To Gather</th>
            <th className="p-4 text-left border-b border-white">Main Category</th>
            <th className="p-4 text-left border-b border-white">Rank Range</th>
            <th className="p-4 text-left border-b border-white"></th>
          </tr>
        </thead>
        <tbody>{scansDisplay}</tbody>
      </table>

      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-white">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="mr-2 px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default ScansList;
