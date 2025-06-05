import React from 'react';

const ProductsScanList = ({ productScanEntries }) => {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-indigo-600">
          <th className="p-2 text-left">ID</th>
          <th className="p-2 text-left">Type</th>
          <th className="p-2 text-left">Region</th>
          <th className="p-2 text-left">Category</th>
          <th className="p-2 text-left">Rank Range</th>
        </tr>
      </thead>
      <tbody>
        {productScanEntries.length ? (
          productScanEntries.map((entry) => (
            <tr key={entry.id} className="border-b border-gray-200">
              <td className="p-2">{entry.id}</td>
              <td className="p-2">{entry.type}</td>
              <td className="p-2">{entry.region}</td>
              <td className="p-2">{entry.category}</td>
              <td className="p-2">{`${entry.minRank} - ${entry.maxRank}`}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="p-2 text-center">
              No scans available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ProductsScanList;
