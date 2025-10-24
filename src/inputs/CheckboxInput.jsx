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

  export default CheckboxInput;