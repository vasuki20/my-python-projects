import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/apiUtil';
import { useNavigate } from 'react-router-dom';

// Component to upload a new file
export const UploadFile = () => {
    const [file, setFile] = useState(null);
    const [fileFormats, setFileFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFileFormats = async () => {
            try {
                const formats = await apiRequest('GET', '/file-formats');
                setFileFormats(formats);
            } catch (error) {
                console.error('Error fetching file formats:', error);
            }
        };
        fetchFileFormats();
    }, []);

    const handleUpload = async () => {
        if (!file || !selectedFormat) {
            alert('Please select a file and format');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_format_id', selectedFormat);

        try {
            await apiRequest('POST', '/upload', formData, true); // Pass true to indicate FormData request
            alert('File uploaded successfully');
            navigate('/files');
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        }
    };


    return (
        <div>
            <h2>Upload New File</h2>
            <select onChange={(e) => setSelectedFormat(e.target.value)} value={selectedFormat}>
                <option value="">Select File Format</option>
                {fileFormats.map(format => (
                    <option key={format.id} value={format.id}>{format.name}</option>
                ))}
            </select>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
};
