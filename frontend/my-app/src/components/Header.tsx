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
      {/* Add other header elements here if needed */}
    </header>
  );
};
