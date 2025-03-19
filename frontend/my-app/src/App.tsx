import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { FileUploads } from "./components/FileUploads";
import { UploadFile } from "./components/UploadFile";
import { ViewFileUpload } from "./components/ViewFileUpload";

import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Redirect to /dashboard if logged in, otherwise to /login */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/files" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* File Uploads Routes */}
        <Route path="/files" element={<ProtectedRoute><FileUploads /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadFile /></ProtectedRoute>} />
        <Route path="/file/:fileId" element={<ProtectedRoute><ViewFileUpload /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
