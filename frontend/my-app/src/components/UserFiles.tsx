import React, { useEffect, useState } from 'react';
import { FaFileUpload, FaEye } from 'react-icons/fa';
import { apiRequest } from '../utils/apiUtil';
import { useNavigate } from 'react-router-dom';

// Component to display all file uploads
export const UserFiles = () => {
    const [userFiles, setUserFiles] = useState<any[]>([]); // Typed userFiles state
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserFiles = async () => {
            try {
                const data = await apiRequest('GET', '/user-files');
                setUserFiles(data);
            } catch (error) {
                console.error('Error fetching file uploads:', error);
                // Handle error, e.g., show an error message
                setUserFiles([]); // Clear files on error or show an error state
            }
        };
        fetchUserFiles();
    }, []);

    return (
        <div className="container mx-auto p-6 bg-white rounded-lg shadow-xl mt-10">
            <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900">Your Uploaded Files</h2>
            <div className="flex justify-end mb-6 space-x-4">
                <button
                    onClick={() => navigate('/parse-receipt')}
                    className="px-6 py-3 flex items-center bg-primary hover:bg-blue-700 rounded-md shadow-sm text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <span style={{ marginRight: '8px' }}><FaFileUpload size={20} /></span> Upload Receipt
                </button>
                <button
                    onClick={() => navigate('/upload')}
                    className="px-6 py-3 flex items-center bg-primary hover:bg-blue-700 rounded-md shadow-sm text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <span style={{ marginRight: '8px' }}><FaFileUpload size={20} /></span> Upload New File
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow-md">
                    <thead className="bg-gray-50">
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
                            <tr key={file.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.file_format}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.created_on).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.no_of_transactions}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => navigate(`/file/${file.id}`)}
                                        className="flex items-center text-primary hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                                    >
                                        <span style={{ marginRight: '8px' }}><FaEye size={20} /></span> View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {userFiles.length === 0 && (
                <p className="text-center text-gray-500 mt-8">No files uploaded yet. Click the button above to upload your first file!</p>
            )}
        </div>
    );
};
