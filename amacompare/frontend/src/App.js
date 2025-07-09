/*
** EPITECH PROJECT, 2025
** Amacompare [WSL: Ubuntu-22.04]
** File description:
** App
*/

import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import PriceHistory from './components/PriceHistory';

const AppContent = () => {
  const { theme } = useTheme();
  
  // États pour les 2 étapes
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [priceComparison, setPriceComparison] = useState(null);
  
  // États de chargement
  const [searchLoading, setSearchLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  
  // Erreurs
  const [searchError, setSearchError] = useState('');
  const [compareError, setCompareError] = useState('');

  // ========== ÉTAPE 1: RECHERCHE DE PRODUITS ==========
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Veuillez saisir un nom de produit');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResults(null);
    setSelectedProduct(null);
    setPriceComparison(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur de recherche');
      
      setSearchResults(data);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // ========== ÉTAPE 2: COMPARAISON PRIX ==========
  const handleCompareProduct = async (product) => {
    if (!product.asin) {
      setCompareError('ASIN non trouvé pour ce produit');
      return;
    }

    setSelectedProduct(product);
    setCompareLoading(true);
    setCompareError('');
    setPriceComparison(null);

    try {
      const response = await fetch(`/api/compare/${product.asin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur de comparaison');
      
      setPriceComparison(data);
    } catch (err) {
      setCompareError(err.message);
    } finally {
      setCompareLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 'Prix non disponible') return price;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const resetSearch = () => {
    setSearchResults(null);
    setSelectedProduct(null);
    setPriceComparison(null);
    setSearchError('');
    setCompareError('');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: theme.background, 
      fontFamily: 'system-ui, sans-serif',
      color: theme.textPrimary,
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: theme.surface, 
        borderBottom: `1px solid ${theme.border}`, 
        padding: '1.5rem 0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: theme.textPrimary, 
              margin: 0,
              cursor: 'pointer'
            }} onClick={resetSearch}>
              🛒 Ama<span style={{ color: theme.primary }}>Compare</span>
              <span style={{ fontSize: '0.5rem', color: theme.textMuted, marginLeft: '0.5rem' }}>
                📊 DARK MODE
              </span>
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ThemeToggle />
              {searchResults && (
                <button
                  onClick={resetSearch}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: theme.hover,
                    color: theme.textSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = theme.pressed;
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = theme.hover;
                  }}
                >
                  ← Nouvelle recherche
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* ========== SECTION RECHERCHE ========== */}
        {!searchResults && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                color: theme.textPrimary, 
                marginBottom: '1rem' 
              }}>
                Trouvez <span style={{ color: theme.primary }}>n'importe quel produit</span> sur Amazon
              </h2>
              <p style={{ fontSize: '1.2rem', color: theme.textMuted, marginBottom: '2rem' }}>
                Recherche dynamique • Comparaison temps réel • Historique des prix • 4 pays européens
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="iPhone, MacBook, PlayStation, AirPods..."
                  style={{
                    flex: 1,
                    padding: '1rem 1.5rem',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '0.75rem',
                    fontSize: '1.1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: theme.surface,
                    color: theme.textPrimary
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={(e) => e.target.style.borderColor = theme.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  style={{
                    padding: '1rem 2rem',
                    backgroundColor: theme.primary,
                    color: theme.textOnPrimary,
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: 'bold',
                    cursor: searchLoading ? 'not-allowed' : 'pointer',
                    opacity: searchLoading ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => !searchLoading && (e.target.style.opacity = '0.9')}
                  onMouseOut={(e) => !searchLoading && (e.target.style.opacity = '1')}
                >
                  {searchLoading ? '🔍 Recherche...' : '🔍 Rechercher'}
                </button>
              </div>
            </div>

            {searchError && (
              <div style={{
                backgroundColor: theme.danger + '20',
                border: `1px solid ${theme.danger}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '2rem',
                color: theme.danger,
                textAlign: 'center',
                maxWidth: '600px',
                margin: '0 auto 2rem'
              }}>
                ❌ {searchError}
              </div>
            )}

            {searchLoading && (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  border: `3px solid ${theme.border}`,
                  borderTop: `3px solid ${theme.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p style={{ color: theme.textMuted }}>Recherche sur Amazon.fr...</p>
                <small style={{ color: theme.textMuted }}>Analyse des résultats en cours</small>
              </div>
            )}
          </div>
        )}

        {/* ========== RÉSULTATS DE RECHERCHE ========== */}
        {searchResults && !selectedProduct && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.textPrimary, marginBottom: '0.5rem' }}>
                {searchResults.count} produits trouvés pour "{searchResults.query}"
              </h3>
              <p style={{ color: theme.textMuted }}>
                Cliquez sur un produit pour comparer les prix européens et voir l'historique
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {searchResults.products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleCompareProduct(product)}
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: `1px solid ${theme.border}`
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.backgroundColor = theme.hover;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.backgroundColor = theme.surface;
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <img
                      src={product.image}
                      alt={product.title}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'contain',
                        borderRadius: '0.5rem',
                        backgroundColor: theme.borderLight
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontWeight: '600',
                        color: theme.textPrimary,
                        fontSize: '0.95rem',
                        lineHeight: '1.3',
                        margin: '0 0 0.5rem 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {product.title}
                      </h4>
                      {product.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ color: theme.warning }}>⭐ {product.rating}</span>
                          {product.reviewsCount && (
                            <span style={{ color: theme.textMuted }}>({product.reviewsCount})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: theme.textPrimary }}>
                        {formatPrice(product.price)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>
                        ASIN: {product.asin}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: theme.primary,
                      color: theme.textOnPrimary,
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      Comparer & Historique →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== COMPARAISON PRIX ========== */}
        {selectedProduct && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setPriceComparison(null);
                  setCompareError('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme.hover,
                  color: theme.textSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = theme.pressed;
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = theme.hover;
                }}
              >
                ← Retour aux résultats
              </button>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'contain',
                    borderRadius: '0.5rem',
                    backgroundColor: theme.borderLight
                  }}
                />
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.textPrimary, margin: '0 0 0.5rem 0' }}>
                    {selectedProduct.title}
                  </h3>
                  <p style={{ color: theme.textMuted, margin: '0' }}>ASIN: {selectedProduct.asin}</p>
                </div>
              </div>
            </div>

            {compareError && (
              <div style={{
                backgroundColor: theme.danger + '20',
                border: `1px solid ${theme.danger}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '2rem',
                color: theme.danger
              }}>
                ❌ {compareError}
              </div>
            )}

            {compareLoading && (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  border: `3px solid ${theme.border}`,
                  borderTop: `3px solid ${theme.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p style={{ color: theme.textMuted }}>Comparaison des prix européens...</p>
                <small style={{ color: theme.textMuted }}>Scraping Amazon FR, DE, IT, ES + Sauvegarde historique</small>
              </div>
            )}

            {/* ========== HISTORIQUE DES PRIX ========== */}
            <PriceHistory 
              asin={selectedProduct.asin} 
              productName={selectedProduct.title}
            />

            {priceComparison && !compareLoading && (
              <div style={{
                backgroundColor: theme.surface,
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                marginTop: '2rem',
                border: `1px solid ${theme.border}`
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: theme.textPrimary, marginBottom: '1.5rem' }}>
                  💰 Comparaison des prix européens (temps réel)
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {priceComparison.countries
                    .sort((a, b) => a.price - b.price)
                    .map((country) => (
                      <div 
                        key={country.country}
                        style={{
                          padding: '1.5rem',
                          borderRadius: '0.75rem',
                          border: country.bestPrice ? `2px solid ${theme.accent}` : `2px solid ${theme.border}`,
                          backgroundColor: country.bestPrice ? theme.accent + '10' : theme.surface,
                          position: 'relative'
                        }}
                      >
                        {country.bestPrice && (
                          <div style={{
                            position: 'absolute',
                            top: '-0.5rem',
                            right: '-0.5rem',
                            backgroundColor: theme.accent,
                            color: theme.textOnPrimary,
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontWeight: 'bold'
                          }}>
                            🏆 MEILLEUR PRIX
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '2rem' }}>{country.flag}</span>
                          <div>
                            <h5 style={{ fontWeight: 'bold', margin: 0, color: theme.textPrimary }}>{country.countryName}</h5>
                            <p style={{ fontSize: '0.875rem', color: theme.textMuted, margin: 0 }}>
                              Amazon.{country.country.toLowerCase()}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: theme.textPrimary }}>
                            {formatPrice(country.price)}
                          </div>
                          {country.savings > 0 && (
                            <div style={{ fontSize: '0.875rem', color: theme.danger }}>
                              +{formatPrice(country.savings)} vs meilleur
                            </div>
                          )}
                        </div>
                        
                        <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                          <div style={{ color: theme.accent, fontWeight: '500' }}>{country.availability}</div>
                          <div style={{ color: theme.textMuted }}>📦 {country.shipping}</div>
                        </div>
                        
                        <a
                          href={country.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            padding: '0.75rem 1rem',
                            backgroundColor: country.bestPrice ? theme.accent : theme.primary,
                            color: theme.textOnPrimary,
                            textDecoration: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.opacity = '0.9';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.opacity = '1';
                          }}
                        >
                          Acheter sur Amazon →
                        </a>
                      </div>
                    ))}
                </div>

                {priceComparison.maxSavings > 0 && (
                  <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: theme.primary + '20',
                    border: `1px solid ${theme.primary}`,
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, color: theme.primary }}>
                      💡 <strong>Économisez jusqu'à {formatPrice(priceComparison.maxSavings)}</strong> en choisissant le bon pays !
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .light-theme {
            --scrollbar-thumb: #cbd5e0;
            --scrollbar-track: #f7fafc;
          }
          
          .dark-theme {
            --scrollbar-thumb: #4a5568;
            --scrollbar-track: #2d3748;
          }
          
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: var(--scrollbar-track);
          }
          
          ::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb);
            border-radius: 4px;
          }
        `}
      </style>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
