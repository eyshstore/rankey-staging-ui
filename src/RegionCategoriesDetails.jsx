import React, { useEffect } from "react";

const RegionCategoriesDetails = ({ mainCategory }) => {
  let categoryDetailsWebSocket;

  useEffect(() => {
    // connection to categories updates goes here

    return () => categoryDetailsWebSocket.close();
  });

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h2 className="text-lg font-bold mb-2">{mainCategory.name}</h2>
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-2 border-b border-white">Name</th>
            <th className="p-2 border-b border-white">Id</th>
          </tr>
        </thead>
        <tbody>
          {
            mainCategory.subCategories.map(subCategory => (
              <tr key={subCategory.id}>
                <td className="p-2 border-b border-white">{subCategory.name}</td>
                <td className="p-2 border-b border-white">{subCategory.id}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

export default RegionCategoriesDetails;
