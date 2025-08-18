import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/apiUtil';
import { useNavigate } from 'react-router-dom';

interface FileFormat {
  id: string;
  name: string;
}

export const UploadFile = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileFormats, setFileFormats] = useState<FileFormat[]>([]);
    const [selectedFormat, setSelectedFormat] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFileFormats = async () => {
            try {
                const formats = await apiRequest('GET', '/bank-file-formats');
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
        formData.append('bank_file_format_id', selectedFormat);

        try {
            await apiRequest('POST', '/upload-user-file', formData, true);
            navigate('/files');
        } catch (error) {
            console.error('Error uploading file:', error as any);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br p-4">
            <div className="bg-white p-12 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                <h2 className="text-4xl font-extrabold mb-8 text-center text-gray-900 tracking-tight">
                    Upload Your File
                </h2>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="file-format" className="block text-lg font-medium text-gray-700 mb-2">
                            File Format
                        </label>
                        <select
                            id="file-format"
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            value={selectedFormat}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-lg placeholder-gray-400"
                        >
                            <option value="">Select File Format</option>
                            {fileFormats.map(format => (
                                <option key={format.id} value={format.id}>{format.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="file-upload" className="block text-lg font-medium text-gray-700 mb-2">
                            Choose File
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-lg placeholder-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white file:cursor-pointer hover:file:bg-cyan-600"
                        />
                    </div>
                    <div className="flex justify-center mt-8 space-x-4"> {/* Added space-x-4 for spacing */}
                        <button
                            onClick={handleUpload}
                            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-md text-xl font-bold bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-150 ease-in-out"
                        >
                            Upload
                        </button>
                        <button onClick={() => navigate('/files')} className="px-8 py-3 bg-gray-500 rounded-lg shadow-md text-lg font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out">
                            Back
                        </button>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};
