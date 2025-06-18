import { useState, useEffect } from 'react';
import useRequest from '../hooks/useRequest.hook';
import config from './config';

const DomainCategoriesDetails = ({ currentDomain }) => {
  const mainCategoriesRequest = useRequest();
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [mainCategoriesState, setMainCategoriesState] = useState([]);

  const fetchData = async () => {
    const response = await mainCategoriesRequest.request(`${config.apiBaseUrl}/amazon/domain-details?domain=${currentDomain}`);
    setBreadcrumbs(response.breadcrumbs);
    setMainCategoriesState(response.mainCategoriesState);
  };

  useEffect(() => {
    setMainCategoriesState([]);
    setBreadcrumbs([]);
    fetchData();

    const eventSource = new EventSource(`${config.apiBaseUrl}/amazon/domain-details/events`, { withCredentials: true });
    eventSource.onmessage = (event) => {
      const { type, patch } = JSON.parse(event.data);
      if (patch.domain === currentDomain) {
        switch (type) {
          case "categories_update":
            setMainCategoriesState(patch.mainCategoriesState);
            break;
          case "breadcrumbs_update":
            setBreadcrumbs(patch.breadcrumbs);
            break;
        }
      }
    };
    eventSource.onerror = (err) => eventSource.close();
    return () => eventSource.close();
  }, [currentDomain]);

  if (!mainCategoriesState || mainCategoriesState.length === 0) {
    return <div className="p-4 text-center text-white h-[calc(100vh-56px)]">No main categories in this domain. Start gathering.</div>;
  }

  const mainCategoriesDisplay = mainCategoriesState.map((mainCategory) => {
    const mainCategoryStateStatusDisplay =
      mainCategory.state === 'started' ? (
        <span className="text-yellow-400">Scraping...</span>
      ) : mainCategory.state === 'completed' ? (
        <span className="text-green-400">Completed</span>
      ) : (
        <span className="text-gray-400">Not started</span>
      );

    return (
      <tr key={mainCategory.nodeId}>
        <td className="p-2 border-b border-white">{mainCategory.name}</td>
        <td className="p-2 border-b border-white">{mainCategory.nodeId}</td>
        <td className="p-2 border-b border-white">{mainCategoryStateStatusDisplay}</td>
      </tr>
    );
  });

  return (
    <div className="h-[calc(100vh-30px)] p-4 flex flex-col">
      {breadcrumbs.length > 0 && (
        <div className="mb-4 shrink-0 h-[4.5rem]">
          <span className="text-yellow-400">Currently scraping: </span>
          <span>{breadcrumbs.join(' -> ')}</span>
        </div>
      )}
      <div className="h-[calc(100%-40px)] bg-gray-800 rounded overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-800">
            <tr>
              <th className="p-2 border-b border-white">Name</th>
              <th className="p-2 border-b border-white">Id</th>
              <th className="p-2 border-b border-white">State</th>
            </tr>
          </thead>
          <tbody>{mainCategoriesDisplay}</tbody>
        </table>
      </div>
    </div>
  );
};

export default DomainCategoriesDetails;