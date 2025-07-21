import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
    </div>
  );
};

export default LoadingSpinner;
