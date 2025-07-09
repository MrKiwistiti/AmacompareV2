/*
** EPITECH PROJECT, 2025
** Amacompare [WSL: Ubuntu-22.04]
** File description:
** PriceAlerts
*/

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const PriceAlerts = ({ asin, productName, productImage, countries, isVisible, onClose }) => {
  const { theme } = useTheme();
  const [alertData, setAlertData] = useState({
    targetPrice: '',
    email: '',
    country: 'FR'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userAlerts, setUserAlerts] = useState([]);
  const [showUserAlerts, setShowUserAlerts] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Charger l'email sauvegardé
  useEffect(() => {
    const savedEmail = localStorage.getItem('amacompare-email');
    if (savedEmail) {
      setAlertData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  // Suggérer un prix cible basé sur le meilleur prix actuel
  useEffect(() => {
    if (countries && countries.length > 0) {
      const bestPrice = Math.min(...countries.map(c => c.price));
      const suggestedPrice = Math.floor(bestPrice * 0.9); // 10% de moins
      setAlertData(prev => ({ ...prev, targetPrice: suggestedPrice.toString() }));
    }
  }, [countries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Sauvegarder l'email
      localStorage.setItem('amacompare-email', alertData.email);

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asin,
          targetPrice: parseFloat(alertData.targetPrice),
          email: alertData.email,
          country: alertData.country,
          productName,
          productImage
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Alerte créée ! Vous recevrez un email si le prix baisse.');
        setAlertData(prev => ({ ...prev, targetPrice: '' }));
        // Recharger les alertes de l'utilisateur
        if (showUserAlerts) {
          loadUserAlerts();
        }
      } else {
        setMessage(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAlerts = async () => {
    if (!alertData.email) return;

    setAlertsLoading(true);
    try {
      const response = await fetch(`/api/alerts/${encodeURIComponent(alertData.email)}`);
      const data = await response.json();

      if (response.ok) {
        setUserAlerts(data.alerts);
      } else {
        console.error('Erreur chargement alertes:', data.error);
      }
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUserAlerts(prev => prev.filter(alert => alert.id !== alertId));
        setMessage('✅ Alerte supprimée');
      } else {
        setMessage('❌ Erreur lors de la suppression');
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la suppression');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getBestCurrentPrice = () => {
    if (!countries || countries.length === 0) return null;
    return Math.min(...countries.map(c => c.price));
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${theme.border}`
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: theme.textPrimary, fontSize: '1.5rem' }}>
            🔔 Alerte Prix
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: theme.textMuted,
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Info produit */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: theme.borderLight,
          borderRadius: '0.5rem'
        }}>
          <img
            src={productImage}
            alt={productName}
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain',
              borderRadius: '0.5rem'
            }}
          />
          <div style={{ flex: 1 }}>
            <h4 style={{
              margin: '0 0 0.5rem 0',
              color: theme.textPrimary,
              fontSize: '1rem',
              lineHeight: '1.3'
            }}>
              {productName}
            </h4>
            <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.875rem' }}>
              ASIN: {asin}
            </p>
            {getBestCurrentPrice() && (
              <p style={{ margin: '0.5rem 0 0 0', color: theme.primary, fontSize: '0.875rem' }}>
                💰 Meilleur prix actuel: {formatPrice(getBestCurrentPrice())}
              </p>
            )}
          </div>
        </div>

        {/* Formulaire d'alerte */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.textPrimary, fontWeight: '500' }}>
              Prix cible (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={alertData.targetPrice}
              onChange={(e) => setAlertData({ ...alertData, targetPrice: e.target.value })}
              placeholder="299.99"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: theme.surface,
                color: theme.textPrimary,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = theme.primary}
              onBlur={(e) => e.target.style.borderColor = theme.border}
              required
            />
            <small style={{ color: theme.textMuted, fontSize: '0.8rem' }}>
              Vous recevrez un email si le prix passe sous ce seuil
            </small>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.textPrimary, fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={alertData.email}
              onChange={(e) => setAlertData({ ...alertData, email: e.target.value })}
              placeholder="votre@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: theme.surface,
                color: theme.textPrimary,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = theme.primary}
              onBlur={(e) => e.target.style.borderColor = theme.border}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: theme.textPrimary, fontWeight: '500' }}>
              Pays à surveiller
            </label>
            <select
              value={alertData.country}
              onChange={(e) => setAlertData({ ...alertData, country: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: theme.surface,
                color: theme.textPrimary,
                outline: 'none'
              }}
            >
              {countries && countries.map(country => (
                <option key={country.country} value={country.country}>
                  {country.flag} {country.countryName} - {formatPrice(country.price)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: theme.primary,
              color: theme.textOnPrimary,
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Création...' : '🔔 Créer l\'alerte'}
          </button>
        </form>

        {/* Message de retour */}
        {message && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '0.5rem',
            backgroundColor: message.includes('✅') ? theme.accent + '20' : theme.danger + '20',
            color: message.includes('✅') ? theme.accent : theme.danger,
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        {/* Bouton pour voir les alertes existantes */}
        {alertData.email && (
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '1rem' }}>
            <button
              onClick={() => {
                setShowUserAlerts(!showUserAlerts);
                if (!showUserAlerts) loadUserAlerts();
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: theme.secondary,
                color: theme.textOnPrimary,
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showUserAlerts ? 'Masquer' : 'Voir'} mes alertes existantes
            </button>

            {/* Liste des alertes existantes */}
            {showUserAlerts && (
              <div style={{ marginTop: '1rem' }}>
                {alertsLoading ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: theme.textMuted }}>
                    Chargement des alertes...
                  </div>
                ) : userAlerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: theme.textMuted }}>
                    Aucune alerte trouvée
                  </div>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {userAlerts.map(alert => (
                      <div key={alert.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        backgroundColor: theme.borderLight,
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: theme.textPrimary, fontWeight: '500' }}>
                            {alert.productName?.slice(0, 30)}...
                          </div>
                          <div style={{ color: theme.textMuted, fontSize: '0.8rem' }}>
                            {alert.flag} {formatPrice(alert.targetPrice)} 
                            {alert.isActive ? ' 🟢 Active' : ' 🔴 Déclenchée'}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: theme.danger,
                            color: theme.textOnPrimary,
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAlerts;
