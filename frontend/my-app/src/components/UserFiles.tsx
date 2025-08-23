import React, { useEffect, useState } from 'react';
import { FaFileUpload, FaEye, FaArrowLeft } from 'react-icons/fa';
import { apiRequest } from '../utils/apiUtil';
import { useNavigate } from 'react-router-dom';

interface FileFormat {
  id: string;
  name: string;
}

// Component to display all file uploads
export const UserFiles: React.FC = () => {
    const [userFiles, setUserFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserFiles = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await apiRequest('GET', '/user-files');
                setUserFiles(data);
            } catch (err: any) {
                console.error('Error fetching file uploads:', err);
                if (err.response && err.response.data && err.response.data.message) {
                    setError(`Failed to load files: ${err.response.data.message}`);
                } else {
                    setError('Failed to load files. Please try again.');
                }
                setUserFiles([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserFiles();
    }, []);

    const goToReceiptParser = () => {
        navigate('/parse-receipt');
    };

    const goToUploadFile = () => {
        navigate('/upload');
    };

    return (
        <div className="container mx-auto p-6 bg-white rounded-lg shadow-xl mt-10">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-3xl font-extrabold text-gray-900">Your Uploaded Files</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={goToReceiptParser}
                        className="px-6 py-2 flex items-center bg-blue-600 rounded-lg shadow-md text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    >
                        <span style={{ marginRight: '8px' }}><FaFileUpload size={20} /></span> Upload Receipt
                    </button>
                    <button
                        onClick={goToUploadFile}
                        className="px-6 py-2 flex items-center bg-gray-200 text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-150 ease-in-out"
                    >
                        <span style={{ marginRight: '8px' }}><FaFileUpload size={20} /></span> Upload Bank File
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            {error && !isLoading && (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-red-100 p-4 rounded-lg">
                    <p className="text-red-600 text-lg mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!isLoading && !error && userFiles.length > 0 && (
                <div className="overflow-hidden rounded-lg shadow-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Format</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No of Transactions</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {userFiles.map(file => (
                                <tr key={file.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.file_format}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.created_on).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.no_of_transactions}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => navigate(`/file/${file.id}`)}
                                            className="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-3 py-1"
                                        >
                                            <span style={{ marginRight: '8px' }}><FaEye size={20} /></span> View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!isLoading && !error && userFiles.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-lg text-gray-500 mb-4">No files uploaded yet.</p>
                    <p className="text-sm text-gray-500 mb-4">Click the button above to upload your first file!</p>
                </div>
            )}
        </div>
    );
};

export default UserFiles;
