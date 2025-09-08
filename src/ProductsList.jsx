import { React } from "react";
import useRequest from "../hooks/useRequest.hook";

import config from "./config";

import * as XLSX from "xlsx";

const ProductsList = () => {
  const productsRequest = useRequest();

  const handleFetchProducts = async (domain) => {
    let { products } = await productsRequest.request(
      `${config.apiBaseUrl}/products?domain=${domain}`
    );

    const fields = [
      'ASIN',
      'scanId',
      'createdAt',
      'status',
      'proxyCountry',
      'title',
      'price',
      'category',
      'isPrime',
      "brand",
      "rank",
      "availabilityQuantity",
      "availabilityStatus",
      "color",
      "size",
      "dateFirstAvailable",
      "discountCoupon",
      "ratingStars",
      "purchaseInfo",
    ];

    const rows = [];

    for (let product of products) {
      const changeHistory = product.changeHistory || [];
      delete product.changeHistory;

      // push the base product
      rows.push(product);

      // push history entries
      const changeHistoryEntries = changeHistory.map((entry) => {
        const changedFieldsObject = entry.changedFields.reduce((object, field) => {
          object[field.field] = field.newValue;
          return object;
        }, {});

        return {
          scanId: entry.scanId,
          createdAt: entry.createdAt,
          status: entry.status,
          timestamp: entry.timestamp,
          ...changedFieldsObject,
        };
      });

      rows.push(...changeHistoryEntries);
    }

    // Normalize rows so they strictly follow the "fields" order
    const orderedRows = rows.map((row) =>
      fields.reduce((obj, key) => {
        obj[key] = row[key] ?? ""; // fill missing fields with empty string
        return obj;
      }, {})
    );

    const worksheet = XLSX.utils.json_to_sheet(orderedRows, { header: fields });
    XLSX.utils.sheet_add_aoa(worksheet, [fields], { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);

    // trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_${domain}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div>
        <table className="w-full border-collapse">
          <tbody>
            <tr onClick={() => handleFetchProducts("com")} className="border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer">
              <td className="p-4">USA (https://www.amazon.com)</td>
            </tr>
            <tr onClick={() => handleFetchProducts("de")} className="border-b border-gray-200 hover:bg-indigo-800 hover:cursor-pointer">
              <td className="p-4">Germany (https://www.amazon.de)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsList;
