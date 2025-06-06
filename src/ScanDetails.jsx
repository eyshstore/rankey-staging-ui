import React from 'react';

const ScanDetails = ({ scan }) => {
  if (!scan) return null;

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h2 className="text-lg font-bold mb-2">Scan Details</h2>
      <table className="border-collapse">
        <tbody>
          <tr>
            <td className="p-2 border-b border-white font-medium">ID</td>
            <td className="p-2 border-b border-white">{scan.id}</td>
          </tr>
          <tr>
            <td className="p-2 border-b border-white font-medium">Type</td>
            <td className="p-2 border-b border-white">{scan.type}</td>
          </tr>
          <tr>
            <td className="p-2 border-b border-white font-medium">Region</td>
            <td className="p-2 border-b border-white">{scan.region}</td>
          </tr>
          <tr>
            <td className="p-2 border-b border-white font-medium">Category</td>
            <td className="p-2 border-b border-white">{scan.category}</td>
          </tr>
          <tr>
            <td className="p-2 border-b border-white font-medium">Rank Range</td>
            <td className="p-2 border-b border-white">{`${scan.minRank} - ${scan.maxRank}`}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ScanDetails;