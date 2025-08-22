import React, { useState } from 'react';
import { apiRequest } from '../utils/apiUtil'; // Corrected import for named export
import { useNavigate } from 'react-router-dom';
import { FaFileUpload, FaTimes } from 'react-icons/fa';
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
    const navigate = useNavigate();

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
            
            <div className="flex items-center justify-center mt-20 bg-gradient-to-br p-4">
                <div className="bg-white p-12 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                    <h2 className="text-4xl font-extrabold mb-8 text-center text-gray-900 tracking-tight">
                        Upload Your Receipt (JPG, PNG, PDF)
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="file-upload" className="block text-lg font-medium text-gray-700 mb-2">
                                Choose File
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                onChange={handleFileChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-lg placeholder-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white file:cursor-pointer hover:file:bg-cyan-600"
                            />
                        </div>
                        <div className="flex justify-center mt-8 space-x-4"> {/* Added space-x-4 for spacing */}
                            <button onClick={() => navigate('/files')} className="px-8 py-3 flex items-center bg-primary hover:bg-blue-700 rounded-lg shadow-md text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out">
                                <span style={{ marginRight: '8px' }}><FaTimes size={20} /></span> Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || isLoading}
                                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-md text-xl font-bold bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-150 ease-in-out"
                            >
                                <span style={{ marginRight: '8px' }}><FaFileUpload size={20} /></span> Upload
                            </button>
                            
                        </div>
                        
                    </div>
                </div>
            </div>
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
