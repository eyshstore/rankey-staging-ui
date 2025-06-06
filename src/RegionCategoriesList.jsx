import React from 'react';

const RegionCategoriesList = ({ mainCategoriesEntries, currentCategoryRegion, setCurrentCategoryRegion }) => {
  const categoryStyle = "border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";
  const selectedCategoryStyle = "bg-indigo-400 border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer";

  return (
    <table className="w-full border-collapse">
      <tbody>
        {mainCategoriesEntries.length ? (
          mainCategoriesEntries.map((entry) => (
            <tr onClick={() => setCurrentCategoryRegion(entry.region)} key={entry.region} className={ currentCategoryRegion == entry.region ? selectedCategoryStyle : categoryStyle }>
              <td className="p-4">{entry.name}</td>
              <td className="py-4 text-right">
                {
                  entry.active ?
                    (
                      <button className="bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                      </button>
                    )
                    :
                    (
                      <button className="bg-red-600 hover:bg-red-800 hover:cursor-pointer text-white p-2 rounded flex items-center justify-center w-10 h-10">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                      </button>
                    )
                }
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2} className="p-4 text-center">
              No scans available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default RegionCategoriesList;
