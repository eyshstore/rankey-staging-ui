import { React } from "react";
import useRequest from "../hooks/useRequest.hook";

import config from "./config";

const ProductsList = () => {
  const productsRequest = useRequest();

  const handleFetchProducts = async (domain) => {
    const { products } = await productsRequest.request(`${config.apiBaseUrl}/products?domain=${domain}`);

    const fields = [
      'ASIN',
      'domain',
      'title',
      'price',
      'category',
      'isPrime',
      'brand',
      'rank',
      'availabilityQuantity',
      'availabilityStatus',
      'color',
      'size',
      'dateFirstAvailable',
      'discountCoupon',
      'ratingStars',
      'purchaseInfo',
      'changedInThisScan',
      'changedFields',
      'status',
    ];

    const rows = [];

    for (let product of products) {
      const changeHistory = product.changeHistory;
      delete product.changeHistory;
      rows.push(product);
      const row = [];
      rows.push(...changeHistory.changedFields);
    }

    console.log(rows.filter(row => row.ASIN == "B0D2JGYX3F"));
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
