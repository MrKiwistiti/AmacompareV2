/*
** EPITECH PROJECT, 2025
** Amacompare [WSL: Ubuntu-22.04]
** File description:
** PriceHistory
*/

import React, { useState, useEffect } from 'react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    AreaChart,
    Area 
} from 'recharts';

const PriceHistory = ({ asin, productName }) => {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedDays, setSelectedDays] = useState(30);
    const [chartType, setChartType] = useState('line');

    const fetchHistory = async (days = 30) => {
        if (!asin) return;
        
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`/api/price-history/${asin}?days=${days}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération');
            }
            
            setHistory(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(selectedDays);
    }, [asin, selectedDays]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit'
        });
    };

    const prepareChartData = () => {
        if (!history || !history.history) return [];
        
        const allDates = new Set();
        const countries = Object.keys(history.history);
        
        // Collecter toutes les dates
        countries.forEach(country => {
            history.history[country].forEach(item => {
                allDates.add(item.date);
            });
        });
        
        // Créer les données pour le graphique
        const sortedDates = Array.from(allDates).sort();
        
        return sortedDates.map(date => {
            const dataPoint = { date: formatDate(date), fullDate: date };
            
            countries.forEach(country => {
                const item = history.history[country].find(h => h.date === date);
                if (item) {
                    dataPoint[country] = item.price;
                }
            });
            
            return dataPoint;
        });
    };

    const getCountryColors = () => ({
        FR: '#3182ce',
        DE: '#48bb78', 
        IT: '#ed8936',
        ES: '#e53e3e'
    });

    const getCountryNames = () => ({
        FR: 'France 🇫🇷',
        DE: 'Allemagne 🇩🇪',
        IT: 'Italie 🇮🇹',
        ES: 'Espagne 🇪🇸'
    });

    const getTrendIcon = (trend) => {
        switch(trend) {
            case 'up': return '📈';
            case 'down': return '📉';
            default: return '➡️';
        }
    };

    const getTrendColor = (trend) => {
        switch(trend) {
            case 'up': return '#e53e3e';
            case 'down': return '#48bb78';
            default: return '#718096';
        }
    };

    if (!asin) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#718096',
                backgroundColor: '#f7fafc',
                borderRadius: '0.5rem',
                margin: '2rem 0'
            }}>
                <h3>📊 Historique des prix</h3>
                <p>Sélectionnez un produit pour voir l'évolution des prix</p>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            margin: '2rem 0'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#1a202c', fontSize: '1.5rem' }}>
                        📊 Historique des prix
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Sélecteur de période */}
                        <select
                            value={selectedDays}
                            onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.375rem',
                                backgroundColor: 'white',
                                color: '#1a202c'
                            }}
                        >
                            <option value={7}>7 jours</option>
                            <option value={30}>30 jours</option>
                            <option value={90}>3 mois</option>
                            <option value={180}>6 mois</option>
                        </select>
                        
                        {/* Sélecteur de type de graphique */}
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.375rem',
                                backgroundColor: 'white',
                                color: '#1a202c'
                            }}
                        >
                            <option value="line">Courbe</option>
                            <option value="area">Aires</option>
                        </select>
                    </div>
                </div>
                
                {productName && (
                    <p style={{ color: '#718096', margin: 0 }}>
                        {productName}
                    </p>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                        width: '2rem',
                        height: '2rem',
                        border: '3px solid #e2e8f0',
                        borderTop: '3px solid #3182ce',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p style={{ color: '#718096' }}>Chargement de l'historique...</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    backgroundColor: '#fed7d7',
                    border: '1px solid #fc8181',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    color: '#c53030',
                    textAlign: 'center'
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Statistiques */}
            {history && history.stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    {Object.entries(history.stats).map(([country, stats]) => (
                        <div key={country} style={{
                            backgroundColor: '#f7fafc',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>
                                    {country === 'FR' ? '🇫🇷' : country === 'DE' ? '🇩🇪' : country === 'IT' ? '🇮🇹' : '🇪🇸'}
                                </span>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1a202c' }}>
                                    {getCountryNames()[country]}
                                </h4>
                                <span style={{ fontSize: '1rem', color: getTrendColor(stats.trend) }}>
                                    {getTrendIcon(stats.trend)}
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#4a5568' }}>
                                <span>Min: {formatPrice(stats.minPrice)}</span>
                                <span>Max: {formatPrice(stats.maxPrice)}</span>
                            </div>
                            
                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                <div style={{ color: '#1a202c', fontWeight: 'bold' }}>
                                    Actuel: {formatPrice(stats.currentPrice)}
                                </div>
                                <div style={{ color: getTrendColor(stats.trend) }}>
                                    {stats.priceChange > 0 ? '+' : ''}{formatPrice(stats.priceChange)} vs moyenne
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Graphique */}
            {history && history.history && Object.keys(history.history).length > 0 && (
                <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer>
                        {chartType === 'line' ? (
                            <LineChart data={prepareChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    domain={['dataMin - 20', 'dataMax + 20']}
                                />
                                <Tooltip 
                                    formatter={(value) => [formatPrice(value), '']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Legend />
                                {Object.keys(history.history).map(country => (
                                    <Line
                                        key={country}
                                        type="monotone"
                                        dataKey={country}
                                        stroke={getCountryColors()[country]}
                                        strokeWidth={2}
                                        dot={{ fill: getCountryColors()[country], strokeWidth: 2, r: 4 }}
                                        name={getCountryNames()[country]}
                                        connectNulls={false}
                                    />
                                ))}
                            </LineChart>
                        ) : (
                            <AreaChart data={prepareChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    domain={['dataMin - 20', 'dataMax + 20']}
                                />
                                <Tooltip 
                                    formatter={(value) => [formatPrice(value), '']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Legend />
                                {Object.keys(history.history).map(country => (
                                    <Area
                                        key={country}
                                        type="monotone"
                                        dataKey={country}
                                        stroke={getCountryColors()[country]}
                                        fill={getCountryColors()[country]}
                                        fillOpacity={0.3}
                                        name={getCountryNames()[country]}
                                        connectNulls={false}
                                    />
                                ))}
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}

            {/* Message si pas d'historique */}
            {history && history.totalRecords === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#718096',
                    backgroundColor: '#f7fafc',
                    borderRadius: '0.5rem'
                }}>
                    <h4>📊 Pas d'historique disponible</h4>
                    <p>Les données d'historique seront collectées lors des prochaines comparaisons.</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
                        💡 Astuce : Plus vous utilisez le comparateur, plus l'historique sera précis !
                    </p>
                </div>
            )}

            {/* Informations */}
            {history && history.totalRecords > 0 && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f7fafc',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#4a5568'
                }}>
                    <p style={{ margin: 0 }}>
                        📈 {history.totalRecords} points de données collectés sur {selectedDays} jours
                        {history.productInfo && (
                            <> • Produit: {history.productInfo.title}</>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PriceHistory;