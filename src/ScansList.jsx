import React from 'react';

const ScansList = ({ productScanEntries, currentScanId, setCurrentScanId }) => {
  const scanStyle = "border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";
  const selectedScanStyle = "bg-indigo-400 border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";

  let productScansDisplay;
  if (productScanEntries.length) {
    productScansDisplay = productScanEntries.map((entry) => {
      let stateControls;
      switch (entry.state) {
        case "enqueued":
          stateControls = (
            <button className="bg-red-600 hover:bg-red-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          );
          break;
        case "active":
          stateControls = (
            <>
              <button className="bg-green-600 hover:bg-green-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
              </button>
              <button className="bg-red-600 hover:bg-red-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                </svg>

              </button>
            </>
          );
          break;
        case "stalled":
          stateControls = (
            <button className="bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          );
          break;
        case "paused":
          stateControls = (
            <button className="bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            </button>
          );
          break;
      }

      return (
        <tr
          onClick={() => setCurrentScanId(entry.id)}
          key={entry.id}
          className={currentScanId === entry.id ? selectedScanStyle : scanStyle}
        >
          <td className="p-4">{entry.id}</td>
          <td className="p-4">{entry.type}</td>
          <td className="p-4">{entry.region}</td>
          <td className="p-4">{entry.category}</td>
          <td className="py-4 text-right">{stateControls}</td>
        </tr>
      );
    });
  } else {
    productScansDisplay = (
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
          <th className="p-4 text-left border-b border-white">Region</th>
          <th className="p-4 text-left border-b border-white">Category</th>
          <th className="p-4 text-left border-b border-white"></th>
        </tr>
      </thead>
      <tbody>
        {productScansDisplay}
      </tbody>
    </table>
  );
};

export default ScansList;
