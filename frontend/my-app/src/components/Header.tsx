import React from 'react';
import { FaReact } from 'react-icons/fa'; // Import the React icon
import logo from './../assets/bank_parser_logo.png'

export const Header = () => {
  return (
    <header style={{ background: '#3b82f6', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ marginRight: '15px' }}>
          <img src={logo} style={{padding: '5px', height: '60px'}}></img>
        </div>
      </div>
      <div>
       <button class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
        <span>Logout</span>
    </button>
       </div>
      {/* Add other header elements here if needed */}
    </header>
  );
};
