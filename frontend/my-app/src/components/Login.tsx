import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");


  const navigate = useNavigate();

  useEffect(() => {
        const verifyToken = async () => {
            if (localStorage.getItem('token')) {
                navigate('/');
            } else {
                return;
            }
        };

        verifyToken();
    }, [navigate]);

  const handleLogin = async (e) => {
      e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:5000/login', { email, password });
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('refreshToken', response.data.refresh_token);
            navigate('/files'); // Redirect to /
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
        <p>Don't have an account? <Link to="/register">Register here</Link></p>
      </form>
      <p>{message}</p>
    </div>
  );
};

