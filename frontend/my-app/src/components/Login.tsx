import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import axiosInstance from '../utils/apiUtil';

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (localStorage.getItem('token')) {
        navigate('/files');
      }
    };
    verifyToken();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/login', { email, password });
      localStorage.setItem('email', email);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      navigate('/files');
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage("An unexpected error occurred during login.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br p-4">
      <div className="bg-white p-12 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-gray-900 tracking-tight">
          Welcome Back!
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-lg placeholder-gray-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-lg placeholder-gray-400"
            />
          </div>
          {message && (
            <p className="text-center text-red-500 text-base font-medium">{message}</p>
          )}
          <button
            type="submit"
            className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-md text-xl font-bold bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            <span style={{ marginRight: '8px' }}><FaSignInAlt size={20} /></span> Login
          </button>
        </form>
        <p className="text-base text-center mt-8 text-gray-600">
          Don't have an account?
          <Link to="/register" className="ml-1 float-right font-medium text-primary hover:text-blue-700 hover:underline transition duration-150 ease-in-out flex items-center">
            <span style={{ marginRight: '8px' }}><FaUserPlus size={20} /></span> Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
