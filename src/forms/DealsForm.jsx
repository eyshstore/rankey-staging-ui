import SelectInput from "../inputs/SelectInput";

const DealsForm = ({ mainCategories, formData, handleInputChange, mainCategoryOnChange }) => {
    return (
        <div className="space-y-4">
            <div>
                <SelectInput
                    label="Main Category"
                    name="mainCategoryId"
                    value={formData.mainCategoryId}
                    onChange={mainCategoryOnChange}
                    options={[
                        { value: "", label: "All" },
                        ...mainCategories.map((mainCategory) => ({
                          value: mainCategory._id,
                          label: mainCategory.name,
                        })),
                      ]}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">

                {/* Full-width row for Number of Products */}
                <div className="col-span-2">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-200">Number of products to gather</label>
                        <input
                            type="number"
                            name="numberOfProductsToGather"
                            id="numberOfProductsToGather"
                            value={formData.numberOfProductsToGather ?? ""}
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

export default DealsForm;