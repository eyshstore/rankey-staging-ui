import React from "react";

const ProductsModal = ({ isOpen, onClose, currentScanId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">

      </div>
    </div>
  );
};

export default ProductsModal;