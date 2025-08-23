import React, { useState, useEffect, useRef } from 'react';
import { FaFileUpload, FaTimes } from 'react-icons/fa';
import { apiRequest } from '../utils/apiUtil';
import { useNavigate } from 'react-router-dom';

interface FileFormat {
  id: string;
  name: string;
}

export const UploadFile: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileFormats, setFileFormats] = useState<FileFormat[]>([]);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // State for success message
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    useEffect(() => {
        const fetchFileFormats = async () => {
            try {
                const formats = await apiRequest('GET', '/bank-file-formats');
                setFileFormats(formats);
            } catch (error) {
                console.error('Error fetching file formats:', error);
                setError('Failed to load file formats.');
            }
        };
        fetchFileFormats();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setError(null);
            setImagePreviewUrl(URL.createObjectURL(file));
            // Auto-upload when file is selected
            handleUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            setError(null);
            setImagePreviewUrl(URL.createObjectURL(file));
            // Auto-upload when file is dropped
            handleUpload(file);
        }
    };

    const handleUpload = async (fileToUpload: File | null = null) => {
        const file = fileToUpload || selectedFile;

        if (!file) {
            setError('Please select a file first.');
            return;
        }
        if (!selectedFormat) {
            setError('Please select a file format.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null); // Clear previous success message

        const formData = new FormData();
        formData.append('file', file);
        formData.append('bank_file_format_id', selectedFormat);

        try {
            const response = await apiRequest('POST', '/upload-user-file', formData, true);
            // Assuming the backend returns { message: "...", file_id: "..." }
            if (response && response.file_id) {
                setSuccessMessage('File uploaded successfully!');
                // Redirect to UserFileDetails after a short delay to show the success message
                setTimeout(() => {
                    navigate(`/file/${response.file_id}`);
                }, 2000); // 2 second delay
            } else {
                // Handle cases where file_id is not returned, though backend should provide it
                setError('Upload successful, but could not retrieve file details. Redirecting to file list.');
                setTimeout(() => {
                    navigate('/files');
                }, 2000);
            }
        } catch (err: any) {
            console.error('Error uploading file:', err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(`Upload failed: ${err.response.data.message}`);
            } else {
                setError('An unexpected error occurred during upload.');
            }
            setIsLoading(false); // Ensure loading is turned off on error
        } finally {
            // If no error occurred and redirect is handled by setTimeout, we don't need to set isLoading to false here
            // However, if an error occurs, we need to ensure isLoading is false.
            // The error handling above already sets setIsLoading(false)
            // If the upload is successful and redirects, isLoading will be false by the time the component unmounts or re-renders.
        }
    };

    const openFileInput = () => {
        fileInputRef.current?.click();
    };

    const goBack = () => {
        navigate('/files');
    };

    return (
        <div className="p-4 border rounded-lg shadow-md flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Upload Your File</h2>
                    <button
                        onClick={goBack}
                        className="px-3 py-1 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
                    >
                        Back
                    </button>
                </div>

                {/* File Format Selection */}
                <div className="mb-4">
                    <label htmlFor="file-format" className="block text-sm font-medium text-gray-700 mb-2">
                        File Format
                    </label>
                    <select
                        id="file-format"
                        onChange={(e) => {
                            setSelectedFormat(e.target.value);
                            setError(null); // Clear error if format changes
                        }}
                        value={selectedFormat}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-base placeholder-gray-400"
                    >
                        <option value="">Select File Format</option>
                        {fileFormats.map(format => (
                            <option key={format.id} value={format.id}>{format.name}</option>
                        ))}
                    </select>
                    {error && selectedFormat === '' && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>

                {/* Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    onClick={openFileInput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        id="fileUploadInput"
                        accept=".csv,.pdf,.xlsx"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label htmlFor="fileUploadInput" className="block text-sm font-medium text-gray-700 mb-2">
                        {isDragging ? 'Drop your file here' : 'Drag and drop your file here, or click to select a file'}
                    </label>
                    <p className="text-xs text-gray-500">Supports CSV, PDF, XLSX</p>
                </div>

                {/* Loading and Error Display */}
                {isLoading && (
                    <div className="flex justify-center items-center h-full mb-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md mb-4">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {successMessage && !isLoading && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md mb-4">
                        {successMessage}
                    </div>
                )}

                {/* File Preview Section */}
                {selectedFile && !isLoading && (
                    <div className="mt-4 flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-2">File Preview</h3>
                        {imagePreviewUrl && (
                            <img
                                src={imagePreviewUrl}
                                alt="File Preview"
                                className="max-w-full h-auto rounded-lg shadow-md border"
                                style={{ maxHeight: '200px' }}
                            />
                        )}
                        {!imagePreviewUrl && selectedFile && (
                            <p className="text-gray-500">Preview not available for this file type.</p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadFile;
