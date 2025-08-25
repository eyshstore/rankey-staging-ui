import SelectInput from "./SelectInput";

const CheckboxInput = ({ label, name, checked, onChange }) => (
  <div className="space-y-1">
    <label className="flex items-center text-sm font-medium text-gray-200">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
      />
      {label}
    </label>
  </div>
);

const CategoryForm = ({ mainCategories, formData, handleInputChange, mainCategoryOnChange }) => {
  const strategies = [
    { value: 'breadth-first-start', label: 'Breadth-first start' },
    { value: 'breadth-first-end', label: 'Breadth-first end' },
    { value: 'depth-first-start', label: 'Depth-first start' },
    { value: 'depth-first-end', label: 'Depth-first end' },
  ];
  
  return (
    <div className="space-y-4">
      <div>
        <SelectInput
          label="Main Category"
          name="mainCategoryId"
          value={formData.mainCategoryId}
          onChange={mainCategoryOnChange}
          options={mainCategories.map((mainCategory) => ({ value: mainCategory._id, label: mainCategory.name, }))}
        />
      </div>
      <div>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-200">Min Rank</label>
              <input
                type="number"
                name="minRank"
                id="minRank"
                value={formData.minRank ?? ""}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-200">Max Rank</label>
              <input
                type="number"
                name="maxRank"
                id="maxRank"
                value={formData.maxRank ?? ''}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col justify-end">
          <SelectInput
            label="Strategy"
            name="strategy"
            value={formData.strategy}
            onChange={handleInputChange}
            options={strategies}
          />
        </div>

        {/* Combined "Use Pages Skipping" and "Pages Skip" in one cell */}
        <div className="space-y-2">
          <CheckboxInput
            label="Use Pages Skipping"
            name="usePagesSkip"
            checked={formData.usePagesSkip}
            onChange={handleInputChange}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-200">Pages Skip</label>
            <input
              type="number"
              name="pagesSkip"
              id="pagesSkip"
              value={formData.pagesSkip ?? ''}
              onChange={handleInputChange}
              min="1"
              disabled={!formData.usePagesSkip}
              className={`w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 ${!formData.usePagesSkip ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>

        {/* Full-width row for Number of Products */}
        <div className="col-span-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-200">Number of products to gather</label>
            <input
              type="number"
              name="numberOfProductsToCheck"
              id="numberOfProductsToCheck"
              value={formData.numberOfProductsToCheck ?? ""}
              onChange={handleInputChange}
              min="1"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;