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
            }
        };
        if (fileId) {
            fetchFileDetails();
        }
    }, [fileId]);

    if (!fileDetails) return <p>Loading...</p>;

    return (
        <div>
            <h2>File Upload Details</h2>
            <p><strong>File Format:</strong> {fileDetails.file_format}</p>
            <p><strong>Uploaded On:</strong> {fileDetails.created_on}</p>
            <h3>Transactions</h3>
            <table border="1">
                <thead>
                    <tr>
                        <th>Transaction Date</th>
                        <th>Amount</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {fileDetails.transactions.map((transaction: any) => (
                        <tr key={transaction.id}>
                            <td>{transaction.transaction_date}</td>
                            <td>{transaction.amount}</td>
                            <td>{transaction.remarks_1}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={() => navigate('/files')}>Back</button>
        </div>
    );
};
