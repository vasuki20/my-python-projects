import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/apiUtil';
import { useParams, useNavigate } from 'react-router-dom';

// Component to view a single file upload
export const UserFileDetails = () => {
    const { fileId } = useParams<{ fileId: string }>(); // Get fileId from URL
    const [fileDetails, setFileDetails] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFileDetails = async () => {
            try {
                const data = await apiRequest('GET', `/user-files/${fileId}`);
                setFileDetails(data);
            } catch (error) {
                console.error('Error fetching file details:', error);
                // Handle error, e.g., show an error message or redirect
                setFileDetails({ error: 'Failed to load file details.' });
            }
        };
        if (fileId) {
            fetchFileDetails();
        }
    }, [fileId]);

    if (!fileDetails) return <div className="flex justify-center items-center min-h-screen text-xl font-semibold text-gray-700">Loading...</div>;
    if (fileDetails.error) return <div className="flex flex-col items-center justify-center min-h-screen bg-red-100 p-4"><p className="text-red-600 text-lg">{fileDetails.error}</p><button onClick={() => navigate('/files')} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Go Back</button></div>;


    return (
        <div className="container mx-auto p-6 bg-white rounded-lg shadow-xl mt-10">
            <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900">File Upload Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <p className="text-lg text-gray-700"><strong className="text-gray-800">File Format:</strong> {fileDetails.file_format}</p>
                </div>
                <div>
                    <p className="text-lg text-gray-700"><strong className="text-gray-800">Uploaded On:</strong> {new Date(fileDetails.created_on).toLocaleDateString()}</p>
                </div>
            </div>

            <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">Transactions</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow-md">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {fileDetails.transactions.map((transaction: any) => (
                            <tr key={transaction.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.remarks_1}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-center mt-8">
                <button onClick={() => navigate('/files')} className="px-8 py-3 bg-blue-600 rounded-md shadow-sm text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Back to Files
                </button>
            </div>
        </div>
    );
};
