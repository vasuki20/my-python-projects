import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaTrash, FaDownload } from 'react-icons/fa'; // Added FaDownload
import { apiRequest } from '../utils/apiUtil';
import { useParams, useNavigate } from 'react-router-dom';

// Component to view a single file upload
export const UserFileDetails: React.FC = () => {
    const { fileId } = useParams<{ fileId: string }>();
    const [fileDetails, setFileDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state
    const [error, setError] = useState<string | null>(null); // Error state

    const navigate = useNavigate();

    useEffect(() => {
        const fetchFileDetails = async () => {
            setIsLoading(true); // Start loading
            setError(null); // Clear previous errors
            try {
                const data = await apiRequest('GET', `/user-files/${fileId}`);
                setFileDetails(data);
            } catch (err: any) {
                console.error('Error fetching file details:', err);
                if (err.response && err.response.data && err.response.data.message) {
                    setError(`Failed to load file details: ${err.response.data.message}`);
                } else {
                    setError('Failed to load file details. Please try again.');
                }
                setFileDetails(null); // Clear data on error
            } finally {
                setIsLoading(false); // End loading
            }
        };
        if (fileId) {
            fetchFileDetails();
        }
    }, [fileId]);

    const handleDeleteFile = async () => {
        if (!fileId) return;

        const confirmDelete = window.confirm('Are you sure you want to delete this file? This action cannot be undone.');

        if (confirmDelete) {
            try {
                await apiRequest('DELETE', `/user-files/${fileId}`);
                alert('File deleted successfully!');
                navigate('/files');
            } catch (error: any) {
                console.error('Error deleting file:', error);
                const errorMessage = error.response?.data?.message || 'Failed to delete file. Please try again.';
                alert(errorMessage);
            }
        }
    };

    // Function to handle file download
    const handleDownloadFile = async () => {
        if (!fileId) return;

        try {
            // Assuming the backend provides a download endpoint or the file URL directly
            // For simplicity, let's assume apiRequest can fetch the file content
            // In a real app, you might need a specific download endpoint or handle blobs differently
            const response = await apiRequest('GET', `/user-files/${fileId}`, null, false, { responseType: 'blob' });

            // Create a blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            // Extract filename from response headers or use a default
            const filename = fileDetails?.file_url?.split('/').pop() || `file_${fileId}`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error: any) {
            console.error('Error downloading file:', error);
            const errorMessage = error.response?.data?.message || 'Failed to download file. Please try again.';
            alert(errorMessage);
        }
    };

    // Render loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-100 p-4">
                <p className="text-red-600 text-lg mb-4">{error}</p>
                <button
                    onClick={() => navigate('/files')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Render file details
    return (
        <div className="container mx-auto p-6 bg-white rounded-lg shadow-xl mt-10">
            <div className="flex justify-between items-center mb-8">
                <button
                    onClick={() => navigate('/files')}
                    className="px-6 py-2 flex items-center bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-150 ease-in-out"
                >
                    <span style={{ marginRight: '8px' }}><FaArrowLeft size={20} /></span>
                    Back
                </button>
                <div className="flex space-x-4">
                    <button
                        onClick={handleDownloadFile}
                        className="px-6 py-2 flex items-center bg-blue-600 rounded-md shadow-md text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    >
                        <span style={{ marginRight: '8px' }}><FaDownload size={20} /></span>
                        Download File
                    </button>
                    <button
                        onClick={handleDeleteFile}
                        className="px-6 py-2 flex items-center bg-red-600 rounded-md shadow-md text-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                    >
                        <span style={{ marginRight: '8px' }}><FaTrash size={20} /></span>
                        Delete File
                    </button>
                </div>
            </div>
            <h2 className="text-3xl font-extrabold mb-6 text-gray-900 border-b pb-4">File Upload Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <p className="text-lg text-gray-700"><strong className="text-gray-800">File Format:</strong> {fileDetails.file_format}</p>
                </div>
                <div>
                    <p className="text-lg text-gray-700"><strong className="text-gray-800">Uploaded On:</strong> {new Date(fileDetails.created_on).toLocaleDateString()}</p>
                </div>
            </div>

            <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">Transactions</h3>
            <div className="overflow-x-auto rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {fileDetails.transactions.map((transaction: any) => {
                        const amount = transaction.amount;

                        return (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${amount < 0 ? "text-green-600" : "text-red-600"}`}>
                               {amount < 0 ? Math.abs(amount).toFixed(2) : `-${Math.abs(amount).toFixed(2)}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.remarks_1}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                </table>
            </div>
            {fileDetails.transactions.length === 0 && (
                <p className="text-center text-gray-500 mt-8">No transactions found for this file.</p>
            )}
        </div>
    );
};

export default UserFileDetails;
