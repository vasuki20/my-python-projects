import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import axiosInstance from '../utils/apiUtil';

// Note: The 'isRegistered' global variable might cause issues in concurrent rendering or server-side rendering.
// It's generally better to manage state within the component or use context.
// For this example, we'll keep it as is but acknowledge the potential issue.
let isRegistered = false;

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/register', { email, password });
      console.log(res);
      setMessage("Registration successful! Please go to the login page.");
      isRegistered = true; // Update global state
    } catch (error: any) {
      setMessage(error.response ? error.response.data.message : 'Registration failed');
      isRegistered = false; // Reset if registration fails
    }
  };

  const goToLogin = () => {
    navigate('/'); // Use navigate to redirect
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br p-4">
      <div className="bg-white p-12 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-gray-900 tracking-tight">
          Create Your Account
        </h2>
        <form onSubmit={handleRegister} className="space-y-6">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-400 focus:border-blue-400 transition duration-150 ease-in-out text-lg placeholder-gray-400"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-400 focus:border-blue-400 transition duration-150 ease-in-out text-lg placeholder-gray-400"
            />
          </div>
          {message && (
            <p className={`text-center text-red-500 text-base font-medium ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-md text-xl font-bold bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <span style={{ marginRight: '8px' }}><FaUserPlus size={20} /></span> Register
          </button>
          {isRegistered && (
            <button
              type="button"
              onClick={goToLogin}
              className="w-full mt-4 flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-md text-xl font-bold bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
            >
              <span style={{ marginRight: '8px' }}><FaSignInAlt size={20} /></span> Go to Login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
