import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { UserFiles } from "./components/UserFiles";
import { UploadFile } from "./components/UploadFile";
import { UserFileDetails } from "./components/UserFileDetails";
import ReceiptParser from "./components/ReceiptParser"; // Import the new component

import "./App.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
    <div className="app-container">
      <Router>
        <Header />
        <Routes>
        {/* Redirect to /dashboard if logged in, otherwise to /login */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/files" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* File Uploads Routes */}
        <Route path="/files" element={<ProtectedRoute><UserFiles /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadFile /></ProtectedRoute>} />
        <Route path="/file/:fileId" element={<ProtectedRoute><UserFileDetails /></ProtectedRoute>} />

        {/* Receipt Parsing Route */}
        <Route path="/parse-receipt" element={<ProtectedRoute><ReceiptParser /></ProtectedRoute>} />
      </Routes>
    </Router>
      <Footer />
    </div>
  );
}

export default App;
