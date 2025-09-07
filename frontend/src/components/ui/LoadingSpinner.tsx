import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  isInitialLoad?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  isInitialLoad = false 
}) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <p className="mt-4 text-gray-600 font-medium">{message}</p>
    {isInitialLoad && (
      <>
        <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
          First load may take 30+ seconds as the backend server wakes up from sleep
        </p>
        <div className="mt-4 w-full max-w-xs bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>
        <p className="mt-2 text-xs text-gray-400">Please wait, connecting to server...</p>
      </>
    )}
  </div>
);

interface ProgressiveLoaderProps {
  progress: number;
  total: number;
  message: string;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({ 
  progress, 
  total, 
  message 
}) => {
  const percentage = Math.round((progress / total) * 100);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] py-6">
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{message}</span>
          <span>{progress}/{total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{width: `${percentage}%`}}
          ></div>
        </div>
        <div className="text-center mt-2 text-xs text-gray-500">
          {percentage}% complete
          {progress === 0 && " - Server starting up..."}
        </div>
      </div>
    </div>
  );
};