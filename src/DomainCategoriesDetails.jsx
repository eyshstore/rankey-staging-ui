import { useState, useEffect } from 'react';
import useRequest from '../hooks/useRequest.hook';

import config from './config';

const DomainCategoriesDetails = ({ currentDomain }) => {
  const mainCategoriesRequest = useRequest();

  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);

  const fetchCategories = async () => {
    const response = await mainCategoriesRequest.request(`${config.apiBaseUrl}/amazon/main-categories?domain=${currentDomain}`);
    setMainCategories(response.mainCategories);
  };

  useEffect(() => {
    fetchCategories();

    const eventSource = new EventSource(`${config.apiBaseUrl}/amazon/domain-details/events`, { withCredentials: true });
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      /*
      switch (data.type) {
        "path_update":
          
          break;
        "path_update":
          
          break;
      }
      */
      
      setMainCategories(data.mainCategories);
    };
    eventSource.onerror = (err) => eventSource.close();
    return () => eventSource.close();
  }, [currentDomain]);

  if (mainCategories.length == 0) {
    return <div className="p-4 text-center text-white">No main categories in this domain. Start gathering.</div>;
  }

  const mainCategoriesDisplay = [];
  for (let mainCategory of mainCategories) {
    const mainCategoryStateDisplay = mainCategory.state === 'started' ? (
        <span className="text-yellow-400">Scraping...</span>
      ) : mainCategory.state === 'completed' ? (
        <span className="text-green-400">Completed</span>
      ) : (
        <span className="text-gray-400">Not started</span>
      );
    
    const mainCategoryDisplay = (
      <tr key={mainCategory.nodeId}>
        <td className="p-2 border-b border-white">{mainCategory.name}</td>
        <td className="p-2 border-b border-white">{mainCategory.nodeId}</td>
        <td className="p-2 border-b border-white">{mainCategoryStateDisplay}</td>
      </tr>
    );

    mainCategoriesDisplay.push(mainCategoryDisplay);
  }

  return (
    <div className="bg-gray-800 p-4 rounded">
      {breadcrumbs.length > 0 && (
        <div className="mb-4">
          <span className="text-yellow-400">Currently scraping: </span>
          <span>{breadcrumbs.join(' -> ')}</span>
        </div>
      )}
      <table className="border-collapse w-full">
        <thead>
          <tr>
            <th className="p-2 border-b border-white">Name</th>
            <th className="p-2 border-b border-white">Id</th>
            <th className="p-2 border-b border-white">State</th>
          </tr>
        </thead>
        <tbody>
          {mainCategoriesDisplay}
        </tbody>
      </table>
    </div>
  );
};

export default DomainCategoriesDetails;