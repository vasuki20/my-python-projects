import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import axios from 'axios';
let isRegistered = false;


export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate(); // Initialize navigate here

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:5000/register', { email, password });
      setMessage("Registration successfull! Please go to login page.")
      isRegistered= true;
    }catch (error) {
      setMessage(error.response ? error.response.data.message : 'Registration failed');
    }
  };

  const goToLogin = () => {
    navigate('/'); // Use navigate to redirect
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
        {isRegistered && (
          <button type="button" onClick={goToLogin}>Login</button> // Conditionally show login button
        )}
      </form>
      <p>{message}</p>
    </div>
  );
};

