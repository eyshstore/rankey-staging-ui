const SelectInput = ({ label, name, value, onChange, options }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-200">{label}</label>
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  export default SelectInput;