import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../utils/apiUtil';
import { useNavigate } from 'react-router-dom';

interface ExtractedReceiptData {
    receipt_id: string | null;
    date: string | null;
    amount: number | null;
    currency: string | null;
}

const ReceiptParser: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setExtractedData(null);
            setError(null);
            setImagePreviewUrl(URL.createObjectURL(file));
            handleUpload(file); // Auto-upload when file is selected
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            setExtractedData(null);
            setError(null);
            setImagePreviewUrl(URL.createObjectURL(file));
            handleUpload(file); // Auto-upload when file is dropped
        }
    };

    // Modified to accept file as argument for auto-upload
    const handleUpload = async (fileToUpload: File | null = null) => {
        const file = fileToUpload || selectedFile; // Use provided file or the state's selectedFile

        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setExtractedData(null);

        const formData = new FormData();
        formData.append('receipt', file);

        try {
            const response = await apiRequest('post', '/parse-receipt', formData, true);
            setExtractedData(response);
        } catch (err: any) {
            console.error('Error uploading receipt:', err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(`Upload failed: ${err.response.data.message}`);
            } else {
                setError('An unexpected error occurred during upload.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number | null, currency: string | null): string => {
        if (amount === null || currency === null) return 'N/A';
        return `${currency} ${amount.toFixed(2)}`;
    };

    const openFileInput = () => {
        fileInputRef.current?.click();
    };

    const goBack = () => {
        navigate('/files');
    };

    return (
        <div className="p-4 border rounded-lg shadow-md flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Parse Receipt</h2>
                    <button
                        onClick={goBack}
                        className="px-3 py-1 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
                    >
                        Back
                    </button>
                </div>

                <div
                    className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    onClick={openFileInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        id="receiptUpload"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label htmlFor="receiptUpload" className="block text-sm font-medium text-gray-700 mb-2">
                        {isDragging ? 'Drop your receipt here' : 'Drag and drop your receipt here, or click to select a file'}
                    </label>
                    <p className="text-xs text-gray-500">Supports JPG, PNG, PDF</p>
                </div>

                {/* Removed the explicit Parse Receipt button */}

                {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {extractedData && !isLoading && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                        <h3 className="font-semibold">Extracted Information:</h3>
                        <p><strong>Receipt ID:</strong> {extractedData.receipt_id || 'N/A'}</p>
                        <p><strong>Date:</strong> {extractedData.date || 'N/A'}</p>
                        <p><strong>Amount:</strong> {formatCurrency(extractedData.amount, extractedData.currency)}</p>
                    </div>
                )}
            </div>

            {/* Image Preview Section */}
            {selectedFile && (
                <div className="md:w-1/2 mt-4 md:mt-0 flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-2">Receipt Preview</h3>
                    {isLoading && (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {!isLoading && imagePreviewUrl && (
                        <img
                            src={imagePreviewUrl}
                            alt="Receipt Preview"
                            className="max-w-full h-auto rounded-lg shadow-md border"
                            style={{ maxHeight: '400px' }}
                        />
                    )}
                    {!isLoading && !imagePreviewUrl && selectedFile && (
                        <p className="text-gray-500">Could not load preview for this file type.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReceiptParser;
