/**
 * Component Template
 * Copy this template to create new React components
 * @copyright Copyright (c) 2026 Prosinres. All rights reserved.
 */

"use client";

import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface MyComponentProps {
  // Required props
  title: string;
  onClose: () => void;
  
  // Optional props
  className?: string;
  isOpen?: boolean;
  data?: any[];
  
  // Callbacks
  onSubmit?: (data: any) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onClose,
  className,
  isOpen = true,
  data = [],
  onSubmit,
  onError,
}) => {
  // ──────────────────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    field1: "",
    field2: "",
  });

  // ──────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Component mount logic
    console.log('[MyComponent] Mounted');
    
    return () => {
      // Cleanup logic
      console.log('[MyComponent] Unmounted');
    };
  }, []);

  useEffect(() => {
    // React to data changes
    if (data.length > 0) {
      console.log('[MyComponent] Data updated:', data.length);
    }
  }, [data]);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.field1) {
        throw new Error("Field 1 is required");
      }

      // Process data
      const result = await processData(formData);

      // Callback
      onSubmit?.(result);

      // Success
      console.log('[MyComponent] Submit successful');
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      onError?.(err);
      console.error('[MyComponent] Submit failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setFormData({ field1: "", field2: "" });
    setError(null);
  };

  // ──────────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────────
  const processData = async (data: any): Promise<any> => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { processed: true, ...data };
  };

  // ──────────────────────────────────────────────────────────────────────
  // RENDER CONDITIONS
  // ──────────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn(
        "bg-[#0d1117] border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Field 1
              </label>
              <input
                type="text"
                value={formData.field1}
                onChange={(e) => handleInputChange("field1", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
                placeholder="Enter value..."
                disabled={isLoading}
              />
            </div>

            {/* Field 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Field 2
              </label>
              <textarea
                value={formData.field2}
                onChange={(e) => handleInputChange("field2", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors resize-none"
                placeholder="Enter description..."
                rows={4}
                disabled={isLoading}
              />
            </div>

            {/* Data Display */}
            {data.length > 0 && (
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">
                  Data items: {data.length}
                </p>
                <div className="space-y-1">
                  {data.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      {JSON.stringify(item)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              isLoading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-yellow-400 text-[#0a233b] hover:bg-yellow-500"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default MyComponent;

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import MyComponent from '@/components/MyComponent';

function App() {
  const [showComponent, setShowComponent] = useState(false);

  return (
    <>
      <button onClick={() => setShowComponent(true)}>
        Open Component
      </button>

      {showComponent && (
        <MyComponent
          title="My Component"
          onClose={() => setShowComponent(false)}
          data={[{ id: 1 }, { id: 2 }]}
          onSubmit={(data) => console.log('Submitted:', data)}
          onError={(error) => console.error('Error:', error)}
        />
      )}
    </>
  );
}
*/
