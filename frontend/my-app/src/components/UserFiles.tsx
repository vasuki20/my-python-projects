import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/apiUtil';
import { useNavigate } from 'react-router-dom';

// Component to display all file uploads
export const UserFiles = () => {
    const [userFiles, setUserFiles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserFiles = async () => {
            try {
                const data = await apiRequest('GET', '/user-files');
                setUserFiles(data);
            } catch (error) {
                console.error('Error fetching file uploads:', error);
            }
        };
        fetchUserFiles();
    }, []);

    return (
        <div>
            <h2>File Uploads</h2>
            <button onClick={() => navigate('/upload')}>Upload New File</button>
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>File Format</th>
                        <th>Created On</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {userFiles.map(file => (
                        <tr key={file.id}>
                            <td>{file.id}</td>
                            <td>{file.file_format}</td>
                            <td>{file.created_on}</td>
                            <td>
                                <button onClick={() => navigate(`/file/${file.id}`)}>View</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
