import React, { useState } from 'react';
import { apiRequest } from '../utils/apiUtil'; // Corrected import for named export

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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setExtractedData(null); // Clear previous data when a new file is selected
            setError(null); // Clear previous errors
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setExtractedData(null);

        const formData = new FormData();
        formData.append('receipt', selectedFile);

        try {
            // Use the apiRequest function for POST requests
            const response = await apiRequest('post', '/parse-receipt', formData, true); // Pass true for isFormData
            setExtractedData(response); // apiRequest returns the data directly
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

    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Parse Receipt</h2>
            <div className="mb-4">
                <label htmlFor="receiptUpload" className="block text-sm font-medium text-gray-700">
                    Upload Receipt (JPG, PNG, PDF)
                </label>
                <input
                    type="file"
                    id="receiptUpload"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-blue-50 file:text-blue-700
                               hover:file:bg-blue-100"
                />
            </div>
            <button
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-black font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Processing...' : 'Parse Receipt'}
            </button>

            {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {extractedData && (
                <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                    <h3 className="font-semibold">Extracted Information:</h3>
                    <p><strong>Receipt ID:</strong> {extractedData.receipt_id || 'N/A'}</p>
                    <p><strong>Date:</strong> {extractedData.date || 'N/A'}</p>
                    <p><strong>Amount:</strong> {extractedData.amount !== null ? `${extractedData.currency || ''} ${extractedData.amount}` : 'N/A'}</p>
                </div>
            )}
        </div>
    );
};

export default ReceiptParser;
