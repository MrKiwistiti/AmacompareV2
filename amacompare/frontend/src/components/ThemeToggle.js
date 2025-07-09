/*
** EPITECH PROJECT, 2025
** Amacompare [WSL: Ubuntu-22.04]
** File description:
** ThemeToggle
*/

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ 
        fontSize: '1.25rem',
        transition: 'opacity 0.2s ease'
      }}>
        ☀️
      </span>
      
      <button
        onClick={toggleTheme}
        style={{
          width: '50px',
          height: '26px',
          backgroundColor: isDarkMode ? theme.primary : theme.border,
          border: 'none',
          borderRadius: '13px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          outline: 'none'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = isDarkMode ? theme.primary : theme.textMuted;
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = isDarkMode ? theme.primary : theme.border;
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: theme.surface,
            borderRadius: '50%',
            position: 'absolute',
            top: '3px',
            left: isDarkMode ? '27px' : '3px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      </button>
      
      <span style={{ 
        fontSize: '1.25rem',
        transition: 'opacity 0.2s ease'
      }}>
        🌙
      </span>
    </div>
  );
};

export default ThemeToggle;
