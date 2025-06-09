import { useState, useEffect } from 'react';
import config from './config';

const RegionCategoriesList = ({ currentCategoryRegion, setCurrentCategoryRegion }) => {
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/amazon/regions`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch regions');
        }
        const data = await response.json();
        // Transform the regions array into the expected format
        const formattedRegions = data.regions.map(region => ({
          region: `https://www.amazon.${region}`,
          active: true, // Default to active; adjust based on your needs
        }));
        setRegions(formattedRegions);
        // Set the first region as default if none is selected
        if (!currentCategoryRegion && formattedRegions.length > 0) {
          setCurrentCategoryRegion(formattedRegions[0].region);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRegions();
  }, [currentCategoryRegion, setCurrentCategoryRegion]);

  const categoryStyle = "border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";
  const selectedCategoryStyle = "bg-indigo-400 border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";

  if (isLoading) {
    return <div className="p-4 text-center text-white">Loading regions...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-400">{error}</div>;
  }

  return (
    <table className="w-full border-collapse">
      <tbody>
        {regions.length ? (
          regions.map((entry) => (
            <tr
              onClick={() => setCurrentCategoryRegion(entry.region)}
              key={entry.region}
              className={currentCategoryRegion === entry.region ? selectedCategoryStyle : categoryStyle}
            >
              <td className="p-4">{entry.region}</td>
              <td className="py-4 text-right">
                {entry.active ? (
                  <button className="bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                    </svg>
                  </button>
                ) : (
                  <button className="bg-red-600 hover:bg-red-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                      />
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2} className="p-4 text-center">
              No regions available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default RegionCategoriesList;