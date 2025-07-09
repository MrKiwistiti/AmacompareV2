/*
** EPITECH PROJECT, 2025
** Amacompare [WSL: Ubuntu-22.04]
** File description:
** ThemeContext
*/

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Charger la préférence sauvegardée
  useEffect(() => {
    const savedTheme = localStorage.getItem('amacompare-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Sauvegarder la préférence
  useEffect(() => {
    localStorage.setItem('amacompare-theme', isDarkMode ? 'dark' : 'light');
    
    // Appliquer le thème au body
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Définir les couleurs des thèmes
  const themes = {
    light: {
      // Couleurs principales
      background: '#f8fafc',
      surface: '#ffffff',
      primary: '#3182ce',
      secondary: '#4a5568',
      accent: '#48bb78',
      danger: '#e53e3e',
      warning: '#ed8936',
      
      // Textes
      textPrimary: '#1a202c',
      textSecondary: '#4a5568',
      textMuted: '#718096',
      textOnPrimary: '#ffffff',
      
      // Bordures et séparateurs
      border: '#e2e8f0',
      borderLight: '#f7fafc',
      
      // États
      hover: '#f7fafc',
      pressed: '#edf2f7',
      disabled: '#a0aec0',
      
      // Graphiques
      chartColors: {
        FR: '#3182ce',
        DE: '#48bb78',
        IT: '#ed8936',
        ES: '#e53e3e'
      }
    },
    dark: {
      // Couleurs principales
      background: '#1a1a1a',
      surface: '#2d2d2d',
      primary: '#4299e1',
      secondary: '#a0aec0',
      accent: '#68d391',
      danger: '#fc8181',
      warning: '#f6ad55',
      
      // Textes
      textPrimary: '#ffffff',
      textSecondary: '#e2e8f0',
      textMuted: '#a0aec0',
      textOnPrimary: '#1a202c',
      
      // Bordures et séparateurs
      border: '#4a5568',
      borderLight: '#2d3748',
      
      // États
      hover: '#2d3748',
      pressed: '#4a5568',
      disabled: '#718096',
      
      // Graphiques
      chartColors: {
        FR: '#4299e1',
        DE: '#68d391',
        IT: '#f6ad55',
        ES: '#fc8181'
      }
    }
  };

  const currentTheme = themes[isDarkMode ? 'dark' : 'light'];

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleTheme,
      theme: currentTheme,
      themes
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
