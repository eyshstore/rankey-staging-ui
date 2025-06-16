import { useState, useEffect } from 'react';

import config from './config';
import useRequest from '../hooks/useRequest.hook';

const DomainsList = ({ currentDomain, setCurrentDomain }) => {
  const domainsRequest = useRequest();
  const startGatheringRequest = useRequest();
  const stopGatheringRequest = useRequest();

  const [domains, setDomains] = useState([]);

  const fetchDomains = async () => {
    const response = await domainsRequest.request(`${config.apiBaseUrl}/amazon/domains`);
    setDomains(response.domains);
  };

  useEffect(() => {
    fetchDomains();

    // Further updates from server
    const eventSource = new EventSource(`${config.apiBaseUrl}/amazon/domain-list/events`, { withCredentials: true });
    eventSource.onmessage = (event) => setDomains(JSON.parse(event.data));
    eventSource.onerror = (err) => eventSource.close();
    return () => eventSource.close();
  }, []);

  const handleStartGathering = async (domain) => {
    try {
      await startGatheringRequest.request(`${config.apiBaseUrl}/amazon/gather-categories?domain=${domain}`, { method: 'POST' });
    } catch (err) {
      console.error('Error starting category gathering:', err.message);
    }
  };


  const categoryStyle = "border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";
  const selectedCategoryStyle = "bg-indigo-400 border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";

  return (
    <div>
      <table className="w-full border-collapse">
        <tbody>
          {Object.keys(domains).length > 0 ? (
            Object.entries(domains).map(([domain, isActive]) => (
              <tr
                onClick={() => setCurrentDomain(domain)}
                key={domain}
                className={domain === currentDomain? selectedCategoryStyle : categoryStyle}
              >
                <td className="p-4">{`https://www.amazon.${domain}`}</td>
                <td className="py-4 text-right">
                  {isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="bg-green-600 size-6 p-2 rounded w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                      </svg>

                  ) : (
                    <button
                      className="bg-red-600 hover:bg-red-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10"
                      onClick={ () => handleStartGathering(domain) }
                      disabled={stopGatheringRequest.loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="p-4 text-center">
                No domains available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DomainsList;