import { useState, useEffect, useCallback } from "react";

const ASINForm = ({ formData, setFormData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [newAsin, setNewAsin] = useState('');
    const itemsPerPage = 10;

    const totalPages = formData.ASINs.length ? Math.ceil(formData.ASINs.length / itemsPerPage) : 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentAsins = formData.ASINs.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        const totalPages = Math.ceil(formData.ASINs.length / itemsPerPage);
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [formData.ASINs, currentPage]);

    const handleAddAsin = useCallback(() => {
        const asin = newAsin.trim().toUpperCase();
        if (!/^[A-Z0-9]{10}$/.test(asin)) {
            alert('Please enter a valid ASIN (10 characters, alphanumeric)');
            return;
        }
        if (formData.ASINs.includes(asin)) {
            alert('This ASIN is already in the list.');
            return;
        }
        setFormData((prev) => {
            const updatedASINs = [...prev.ASINs, asin];
            setCurrentPage(Math.ceil(updatedASINs.length / itemsPerPage));
            return { ...prev, ASINs: updatedASINs };
        });
        setNewAsin('');
    }, [formData.ASINs, newAsin]);

    const handleRemoveAsin = useCallback((index) => {
        setFormData((prev) => ({
            ...prev,
            ASINs: prev.ASINs.filter((_, i) => i !== index),
        }));
    }, []);

    const handleFileUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        const processRows = (rows) => {
            if (!rows.length) {
                alert('The uploaded file is empty.');
                return;
            }
            const header = rows[0].map((cell) => String(cell).toLowerCase());
            const asinIndex = header.findIndex((cell) => cell.includes('asin'));
            if (asinIndex === -1) {
                alert('No column with "ASIN" found in the file.');
                return;
            }
            const extractedASINs = rows
                .slice(1)
                .map((row) => row[asinIndex]?.toString().trim().toUpperCase())
                .filter((asin) => /^[A-Z0-9]{10}$/.test(asin));
            setFormData((prev) => {
                const unique = new Set(extractedASINs);
                const newList = Array.from(unique);
                setCurrentPage(Math.ceil(newList.length / itemsPerPage));
                return { ...prev, ASINs: newList };
            });
        };

        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'csv') {
            reader.onload = (event) => {
                const text = event.target.result;
                const rows = text.split('\n').map((row) => row.split(','));
                processRows(rows);
            };
            reader.readAsText(file);
        } else if (fileExtension === 'xlsx') {
            reader.onload = (event) => {
                const data = event.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Look for the "Products" sheet
                const sheetName = workbook.SheetNames.find(
                    (name) => name.toLowerCase() === 'products'
                );

                if (!sheetName) {
                    alert('No sheet named "Products" found in the Excel file.');
                    return;
                }

                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                processRows(rows);
            };
            reader.readAsBinaryString(file);
        } else {
            alert('Unsupported file format. Please upload a CSV or XLSX file.');
        }

        e.target.value = null;
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex space-x-2">
                <label
                    htmlFor="fileUpload"
                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Upload file with ASINs
                </label>
                <input
                    id="fileUpload"
                    accept=".csv,.xlsx"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, ASINs: [] }))}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                    Reset
                </button>
            </div>
            <table className="w-full text-white border-collapse">
                <tbody>
                    {currentAsins.map((asin, index) => (
                        <tr key={startIndex + index} className="border-b border-gray-600">
                            <td className="p-2">
                                <span className="block p-1 rounded">{asin}</span>
                            </td>
                            <td className="p-2 text-right">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAsin(startIndex + index)}
                                    className="p-1 bg-red-600 rounded hover:bg-red-700"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-4 h-4"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex items-center space-x-2">
                <button
                    type="button"
                    onClick={handleAddAsin}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add ASIN
                </button>
                <input
                    type="text"
                    value={newAsin}
                    onChange={(e) => setNewAsin(e.target.value)}
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new ASIN"
                    id="newAsin"
                    maxLength={10}
                />
            </div>
            <div className="flex justify-between items-center">
                <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-white">Page {currentPage} of {totalPages}</span>
                <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ASINForm;