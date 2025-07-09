/*
** EPITECH PROJECT, 2025
** Amacompare [WSL: Ubuntu-22.04]
** File description:
** server v4.1.0 - Avec better-sqlite3
*/

const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuration de la base de données
const dbPath = path.join(__dirname, 'price_history.db');
const db = new Database(dbPath);

// Configuration
const CONFIG = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CACHE_DURATION: parseInt(process.env.CACHE_DURATION) || 3600,
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 25000,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['http://localhost:3000'],
    // Configuration Email
    EMAIL_USER: process.env.EMAIL_USER || 'votre-email@gmail.com',
    EMAIL_PASS: process.env.EMAIL_PASS || 'votre-mot-de-passe-app',
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail'
};

const cache = new NodeCache({ stdTTL: CONFIG.CACHE_DURATION });

// Logging (définir avant son utilisation)
const log = (message, data = null, level = 'info') => {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[CONFIG.LOG_LEVEL] || 2;
    const messageLevel = levels[level] || 2;
    
    if (messageLevel <= currentLevel) {
        const timestamp = new Date().toISOString();
        const emoji = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '🔍' };
        console.log(`${emoji[level]} [${timestamp}] ${message}`);
        if (data && CONFIG.LOG_LEVEL === 'debug') {
            console.log('📊 Data:', JSON.stringify(data, null, 2));
        }
    }
};

// Créer les tables au démarrage
try {
    // Table historique des prix
    db.exec(`CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asin TEXT NOT NULL,
        country TEXT NOT NULL,
        price REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        title TEXT,
        image_url TEXT,
        availability TEXT,
        url TEXT
    )`);
    
    // Nouvelle table : Alertes prix
    db.exec(`CREATE TABLE IF NOT EXISTS price_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asin TEXT NOT NULL,
        target_price REAL NOT NULL,
        email TEXT NOT NULL,
        country TEXT NOT NULL,
        product_name TEXT,
        product_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        triggered_at DATETIME NULL
    )`);
    
    // Index pour les performances
    db.exec(`CREATE INDEX IF NOT EXISTS idx_asin_country ON price_history(asin, country)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_timestamp ON price_history(timestamp)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_asin ON price_alerts(asin)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_active ON price_alerts(is_active)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_email ON price_alerts(email)`);
    
    log('📊 Base de données initialisée avec tables price_history et price_alerts');
} catch (error) {
    log(`❌ Erreur initialisation base de données: ${error.message}`, null, 'error');
    process.exit(1);
}

// Middleware
app.use(cors({
    origin: CONFIG.NODE_ENV === 'production' ? CONFIG.ALLOWED_ORIGINS : ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ========== SYSTÈME D'ALERTES EMAIL ==========

// Configuration du transporteur email
const getEmailTransporter = () => {
    return nodemailer.createTransporter({
        service: CONFIG.EMAIL_SERVICE,
        auth: {
            user: CONFIG.EMAIL_USER,
            pass: CONFIG.EMAIL_PASS
        }
    });
};

// Fonction pour envoyer une alerte email
const sendPriceAlert = async (alert, currentPrice, savings) => {
    const transporter = getEmailTransporter();
    
    const mailOptions = {
        from: CONFIG.EMAIL_USER,
        to: alert.email,
        subject: `🚨 Alerte Prix - ${alert.product_name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 2rem;">🎉 Alerte Prix !</h1>
                    <p style="margin: 0.5rem 0 0 0; font-size: 1.2rem;">Votre produit surveillé a baissé</p>
                </div>
                
                <div style="padding: 2rem; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <img src="${alert.product_image}" alt="${alert.product_name}" style="width: 150px; height: 150px; object-fit: contain; border-radius: 10px; background: #f8f9fa;">
                    </div>
                    
                    <h2 style="color: #1a202c; margin: 0 0 1rem 0;">${alert.product_name}</h2>
                    
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                            <span style="font-weight: bold; color: #4a5568;">Prix cible :</span>
                            <span style="color: #e53e3e; font-size: 1.1rem;">${alert.target_price.toFixed(2)}€</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                            <span style="font-weight: bold; color: #4a5568;">Prix actuel :</span>
                            <span style="color: #48bb78; font-size: 1.2rem; font-weight: bold;">${currentPrice.toFixed(2)}€</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                            <span style="font-weight: bold; color: #4a5568;">Économie :</span>
                            <span style="color: #48bb78; font-size: 1.3rem; font-weight: bold;">-${savings.toFixed(2)}€</span>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 2rem 0;">
                        <a href="${buildAmazonUrl(alert.asin, alert.country)}" style="background: #48bb78; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 1.1rem;">
                            🛒 Acheter maintenant sur Amazon
                        </a>
                    </div>
                    
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; text-align: center; color: #718096; font-size: 0.9rem;">
                        <p>Pays: ${getCountryData(alert.country).name} ${getCountryData(alert.country).flag}</p>
                        <p>Cette alerte a été automatiquement désactivée.</p>
                        <p>Merci d'utiliser AmaCompare !</p>
                    </div>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        log(`📧 Alerte envoyée à ${alert.email} pour ${alert.product_name}`);
        return true;
    } catch (error) {
        log(`❌ Erreur envoi email: ${error.message}`, null, 'error');
        return false;
    }
};

// Fonction pour vérifier les alertes après chaque comparaison
const checkPriceAlerts = async (asin, currentPrices) => {
    try {
        const alerts = db.prepare(`
            SELECT * FROM price_alerts 
            WHERE asin = ? AND is_active = 1
        `).all(asin);
        
        if (alerts.length === 0) {
            return;
        }
        
        log(`🔔 Vérification de ${alerts.length} alertes pour ASIN ${asin}`);
        
        for (const alert of alerts) {
            const countryPrice = currentPrices.find(p => p.country === alert.country);
            
            if (countryPrice && countryPrice.price <= alert.target_price) {
                const savings = alert.target_price - countryPrice.price;
                
                log(`🎯 Alerte déclenchée ! Prix ${countryPrice.price}€ <= cible ${alert.target_price}€`);
                
                // Envoyer l'email
                const emailSent = await sendPriceAlert(alert, countryPrice.price, savings);
                
                if (emailSent) {
                    // Désactiver l'alerte
                    db.prepare(`
                        UPDATE price_alerts 
                        SET is_active = 0, triggered_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    `).run(alert.id);
                    
                    log(`✅ Alerte ${alert.id} désactivée après envoi`);
                }
            }
        }
    } catch (error) {
        log(`❌ Erreur vérification alertes: ${error.message}`, null, 'error');
    }
};

// ========== FONCTIONS UTILITAIRES ==========

// Fonction pour sauvegarder l'historique des prix
const savePriceHistory = async (asin, countryData) => {
    if (!asin || !countryData || countryData.length === 0) return;
    
    try {
        const stmt = db.prepare(`
            INSERT INTO price_history (asin, country, price, title, image_url, availability, url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        countryData.forEach(country => {
            stmt.run([
                asin, 
                country.country, 
                country.price, 
                country.title, 
                country.image, 
                country.availability,
                country.url
            ]);
        });
        
        log(`💾 Historique sauvegardé pour ASIN ${asin} - ${countryData.length} pays`);
    } catch (error) {
        log(`❌ Erreur sauvegarde historique: ${error.message}`, null, 'error');
    }
};

// Fonction pour calculer les statistiques
const calculatePriceStats = (historyByCountry) => {
    const stats = {};
    
    Object.keys(historyByCountry).forEach(country => {
        const prices = historyByCountry[country].map(item => item.price);
        
        if (prices.length > 0) {
            const sortedPrices = prices.sort((a, b) => a - b);
            const minPrice = sortedPrices[0];
            const maxPrice = sortedPrices[sortedPrices.length - 1];
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            
            // Tendance (prix actuel vs moyenne)
            const currentPrice = prices[prices.length - 1];
            const trend = currentPrice > avgPrice ? 'up' : currentPrice < avgPrice ? 'down' : 'stable';
            
            stats[country] = {
                minPrice: minPrice,
                maxPrice: maxPrice,
                avgPrice: Math.round(avgPrice * 100) / 100,
                currentPrice: currentPrice,
                trend: trend,
                priceChange: Math.round((currentPrice - avgPrice) * 100) / 100,
                totalRecords: prices.length
            };
        }
    });
    
    return stats;
};

// Utilitaires
const extractASIN = (url) => {
    if (!url) return null;
    const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
    return asinMatch ? asinMatch[1] : null;
};

const cleanPrice = (priceText) => {
    if (!priceText || typeof priceText !== 'string') {
        log(`❌ Prix invalide reçu: ${priceText}`, null, 'debug');
        return null;
    }
    
    log(`🏷️ Prix brut reçu: "${priceText}"`, null, 'debug');
    
    // Nettoyer le texte des caractères parasites
    let cleanText = priceText
        .replace(/[\s\u00A0\u2000-\u200B\u2028\u2029]/g, '') // Supprimer tous les espaces
        .replace(/[^\d,.-]/g, '') // Garder seulement chiffres, virgules, points, tirets
        .trim();
    
    log(`🧹 Après nettoyage: "${cleanText}"`, null, 'debug');
    
    // Patterns pour différents formats de prix européens
    const patterns = [
        // Format: 1.234,56 (Allemagne, Italie)
        /^(\d{1,3}(?:\.\d{3})*),(\d{2})$/,
        // Format: 1,234.56 (format US parfois utilisé)
        /^(\d{1,3}(?:,\d{3})*).(\d{2})$/,
        // Format: 1234,56 (France, Espagne)
        /^(\d+),(\d{2})$/,
        // Format: 1234.56 (format décimal simple)
        /^(\d+).(\d{2})$/,
        // Format: 1234 (prix entier)
        /^(\d+)$/,
        // Format avec tirets (prix barrés)
        /^(\d+)[,-](\d+)[,-](\d+)$/
    ];
    
    for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = cleanText.match(pattern);
        
        if (match) {
            log(`✅ Pattern ${i + 1} trouvé: ${match[0]}`, null, 'debug');
            
            let price;
            if (match.length === 2) {
                // Prix entier (pattern 5)
                price = parseFloat(match[1]);
            } else if (match.length === 3) {
                // Prix avec décimales (patterns 1-4)
                const integerPart = match[1].replace(/[.,]/g, ''); // Supprimer séparateurs de milliers
                const decimalPart = match[2];
                price = parseFloat(`${integerPart}.${decimalPart}`);
            } else if (match.length === 4) {
                // Prix complexe (pattern 6)
                price = parseFloat(match[1]);
            }
            
            // Validation du prix
            if (!isNaN(price) && price > 0 && price < 100000) { // Prix raisonnable (< 100k€)
                log(`💰 Prix final: ${price}€`, null, 'debug');
                return Math.round(price * 100) / 100; // Arrondir à 2 décimales
            }
        }
    }
    
    // Si aucun pattern ne fonctionne, essayer extraction simple
    const simpleNumbers = cleanText.match(/\d+/g);
    if (simpleNumbers && simpleNumbers.length > 0) {
        const firstNumber = parseFloat(simpleNumbers[0]);
        if (!isNaN(firstNumber) && firstNumber > 0 && firstNumber < 100000) {
            log(`🔧 Prix extrait par fallback: ${firstNumber}€`, null, 'debug');
            return firstNumber;
        }
    }
    
    log(`❌ Impossible de parser le prix: "${priceText}"`, null, 'error');
    return null;
};

const buildAmazonUrl = (asin, country) => {
    const domains = { FR: 'amazon.fr', DE: 'amazon.de', IT: 'amazon.it', ES: 'amazon.es' };
    return `https://www.${domains[country]}/dp/${asin}`;
};

const getCountryData = (country) => {
    const countryData = {
        FR: { name: 'France', flag: '🇫🇷' },
        DE: { name: 'Allemagne', flag: '🇩🇪' },
        IT: { name: 'Italie', flag: '🇮🇹' },
        ES: { name: 'Espagne', flag: '🇪🇸' }
    };
    return countryData[country];
};

const getShippingText = (country) => {
    const shippingTexts = {
        FR: 'Livraison gratuite',
        DE: 'Kostenloser Versand', 
        IT: 'Spedizione gratuita',
        ES: 'Envío gratis'
    };
    return shippingTexts[country] || 'Livraison gratuite';
};

// Configuration Puppeteer optimisée
const getBrowserConfig = () => {
    const config = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor'
        ]
    };
    
    if (CONFIG.PUPPETEER_EXECUTABLE_PATH) {
        config.executablePath = CONFIG.PUPPETEER_EXECUTABLE_PATH;
    }
    
    return config;
};

// ========== RECHERCHE DE PRODUITS ==========
const searchProductsOnAmazon = async (productName) => {
    log(`🔍 RECHERCHE DYNAMIQUE pour: "${productName}"`);
    
    const browser = await puppeteer.launch(getBrowserConfig());
    
    try {
        const page = await browser.newPage();
        
        // Configuration avancée de la page
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        page.setDefaultTimeout(CONFIG.REQUEST_TIMEOUT);
        
        // Désactiver les images pour plus de rapidité
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font'){
                req.abort();
            } else {
                req.continue();
            }
        });
        
        const searchUrl = `https://www.amazon.fr/s?k=${encodeURIComponent(productName)}&ref=nb_sb_noss`;
        log(`🔗 URL de recherche: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.REQUEST_TIMEOUT });
        
        // Accepter les cookies si nécessaire
        try {
            const cookieButton = await page.$('#sp-cc-accept');
            if (cookieButton) {
                await cookieButton.click();
                log('Cookies acceptés');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (e) {
            log('Pas de bannière de cookies', null, 'debug');
        }
        
        // Attendre que la page se charge complètement
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Sélecteurs Amazon mis à jour pour 2025
        const products = await page.evaluate(() => {
            // Essayer plusieurs sélecteurs possibles pour les résultats
            const possibleSelectors = [
                '[data-component-type="s-search-result"]',
                '.s-result-item[data-asin]',
                '.s-search-result',
                '[data-asin]:not([data-asin=""])',
                '.sg-col-inner .s-widget-container'
            ];
            
            let searchResults = [];
            
            for (const selector of possibleSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    searchResults = Array.from(elements);
                    console.log(`Trouvé ${elements.length} résultats avec le sélecteur: ${selector}`);
                    break;
                }
            }
            
            if (searchResults.length === 0) {
                console.log('Aucun résultat trouvé avec les sélecteurs standards, recherche alternative...');
                // Sélecteur de fallback très large
                searchResults = Array.from(document.querySelectorAll('div[data-asin], div[data-index]')).filter(el => {
                    return el.getAttribute('data-asin') && el.getAttribute('data-asin') !== '';
                });
            }
            
            console.log(`Total des éléments trouvés: ${searchResults.length}`);
            
            return searchResults.map((result, index) => {
                try {
                    // Extraire l'ASIN directement de l'attribut
                    const asin = result.getAttribute('data-asin') || result.getAttribute('data-index');
                    
                    if (!asin || asin === '') return null;
                    
                    // Titre - essayer plusieurs sélecteurs
                    const titleSelectors = [
                        'h2 a span',
                        'h2 span',
                        '.a-size-mini span',
                        '.a-size-base-plus',
                        'h2 a',
                        '.s-size-mini span'
                    ];
                    
                    let title = '';
                    for (const selector of titleSelectors) {
                        const titleElement = result.querySelector(selector);
                        if (titleElement && titleElement.textContent.trim()) {
                            title = titleElement.textContent.trim();
                            break;
                        }
                    }
                    
                    if (!title) return null;
                    
                    // Lien - essayer plusieurs méthodes
                    let url = '';
                    const linkElement = result.querySelector('h2 a, .a-link-normal');
                    if (linkElement && linkElement.href) {
                        url = linkElement.href;
                    } else {
                        // Construire l'URL si pas trouvée
                        url = `https://www.amazon.fr/dp/${asin}`;
                    }
                    
                    // Prix - essayer plusieurs sélecteurs
                    const priceSelectors = [
                        '.a-price .a-offscreen',
                        '.a-price-whole',
                        '.a-price-range',
                        '.a-offscreen',
                        '.a-price .a-price-fraction',
                        '.s-price-instructions-style'
                    ];
                    
                    let price = 'Prix non disponible';
                    for (const selector of priceSelectors) {
                        const priceElement = result.querySelector(selector);
                        if (priceElement && priceElement.textContent.trim()) {
                            price = priceElement.textContent.trim();
                            break;
                        }
                    }
                    
                    // Image - essayer plusieurs sélecteurs
                    const imageSelectors = [
                        'img.s-image',
                        '.s-product-image img',
                        'img[data-image-latency]',
                        'img'
                    ];
                    
                    let image = 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Image+non+disponible';
                    for (const selector of imageSelectors) {
                        const imageElement = result.querySelector(selector);
                        if (imageElement) {
                            const src = imageElement.src || imageElement.getAttribute('data-src');
                            if (src && src.startsWith('http')) {
                                image = src;
                                break;
                            }
                        }
                    }
                    
                    // Rating et avis
                    const ratingElement = result.querySelector('.a-icon-alt, .a-star-mini');
                    const rating = ratingElement?.textContent?.match(/[\d,]+/)?.[0] || '';
                    
                    const reviewsElement = result.querySelector('a[href*="#customerReviews"] span, .a-size-base');
                    const reviewsCount = reviewsElement?.textContent?.trim() || '';
                    
                    return {
                        id: index + 1,
                        title: title,
                        price: price,
                        image: image,
                        url: url,
                        rating: rating,
                        reviewsCount: reviewsCount,
                        asin: asin,
                        searchRank: index + 1
                    };
                } catch (error) {
                    console.error('Erreur extraction produit:', error);
                    return null;
                }
            }).filter(Boolean).slice(0, 20); // Limiter à 20 résultats
        });
        
        // Nettoyer les prix et valider les données
        const cleanedProducts = products.map(product => {
            const cleanedPrice = cleanPrice(product.price);
            
            return {
                ...product,
                price: cleanedPrice,
                priceText: product.price,
                asin: product.asin
            };
        }).filter(product => product.asin && product.title.length > 5); // Filtrer les produits valides
        
        log(`✅ ${cleanedProducts.length} produits trouvés dynamiquement`);
        
        if (cleanedProducts.length === 0) {
            log('⚠️ Aucun produit trouvé, vérification des sélecteurs nécessaire', null, 'warn');
        }
        
        return cleanedProducts;
        
    } catch (error) {
        log(`❌ Erreur lors de la recherche: ${error.message}`, null, 'error');
        throw error;
    } finally {
        await browser.close();
    }
};

// ========== COMPARAISON PRIX PAR PAYS AVEC ALERTES ==========
const compareProductByASIN = async (asin) => {
    log(`💰 COMPARAISON pour ASIN: ${asin}`);
    
    const countries = ['FR', 'DE', 'IT', 'ES'];
    const results = await Promise.allSettled(
        countries.map(country => scrapeProductFromCountry(asin, country))
    );
    
    const successfulResults = [];
    const errors = [];
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const countryInfo = getCountryData(countries[index]);
            successfulResults.push({
                ...result.value,
                countryName: countryInfo.name,
                flag: countryInfo.flag
            });
        } else {
            errors.push({
                country: countries[index],
                error: result.reason.message
            });
        }
    });
    
    if (successfulResults.length === 0) {
        throw new Error('Impossible de récupérer les prix sur aucun site Amazon');
    }
    
    // Sauvegarder l'historique
    try {
        await savePriceHistory(asin, successfulResults);
    } catch (error) {
        log(`⚠️ Erreur sauvegarde historique: ${error.message}`, null, 'warn');
    }
    
    // Vérifier les alertes prix
    try {
        await checkPriceAlerts(asin, successfulResults);
    } catch (error) {
        log(`⚠️ Erreur vérification alertes: ${error.message}`, null, 'warn');
    }
    
    // Calculer le meilleur prix et les économies
    const bestPrice = Math.min(...successfulResults.map(r => r.price));
    successfulResults.forEach(result => {
        result.bestPrice = result.price === bestPrice;
        result.savings = Math.round((result.price - bestPrice) * 100) / 100;
    });
    
    return {
        asin,
        productName: successfulResults[0].title,
        image: successfulResults[0].image,
        countries: successfulResults,
        bestPrice,
        maxSavings: Math.max(...successfulResults.map(r => r.savings)),
        successCount: successfulResults.length,
        errors: errors.length > 0 ? errors : undefined
    };
};

const scrapeProductFromCountry = async (asin, country) => {
    const browser = await puppeteer.launch(getBrowserConfig());
    
    try {
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        page.setDefaultTimeout(CONFIG.REQUEST_TIMEOUT);
        
        const url = buildAmazonUrl(asin, country);
        log(`🔗 Scraping ${country}: ${url}`, null, 'debug');
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.REQUEST_TIMEOUT });
        
        // Accepter les cookies
        try {
            const cookieButton = await page.$('#sp-cc-accept');
            if (cookieButton) {
                await cookieButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (e) {
            // Pas de cookies
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Extraire les données du produit
        const productData = await page.evaluate(() => {
            // Titre
            const titleSelectors = ['#productTitle', '.product-title', 'h1.a-size-large', 'h1 span'];
            let title = 'Titre non trouvé';
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    title = element.textContent.trim();
                    break;
                }
            }
            
            // Prix
            const priceSelectors = [
                '.a-price .a-offscreen',
                '.a-price-whole',
                '.a-price-fraction',
                '#priceblock_dealprice',
                '#priceblock_ourprice',
                '.a-size-medium.a-color-price',
                '.a-price-range .a-offscreen',
                '.a-price .a-price-symbol',
                '.a-price-whole + .a-price-fraction',
                '.a-price-display .a-offscreen'
            ];
            
            let price = null;
            let priceElement = null;
            
            for (const selector of priceSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    price = element.textContent.trim();
                    priceElement = selector;
                    console.log(`Prix trouvé avec sélecteur "${selector}": "${price}"`);
                    break;
                }
            }
            
            // Si pas de prix trouvé, essayer de chercher n'importe quel élément avec "€" ou "EUR"
            if (!price) {
                const allElements = document.querySelectorAll('*');
                for (const element of allElements) {
                    const text = element.textContent || '';
                    if (text.includes('€') || text.includes('EUR')) {
                        const match = text.match(/[\d\s,.]+\s*€/);
                        if (match) {
                            price = match[0];
                            priceElement = 'fallback-euro-search';
                            console.log(`Prix trouvé par fallback: "${price}"`);
                            break;
                        }
                    }
                }
            }
            
            // Image
            const imageSelectors = ['#landingImage', '[data-old-hires]', '.a-dynamic-image', '#imgBlkFront'];
            let image = 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Image+non+disponible';
            for (const selector of imageSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const src = element.src || element.getAttribute('data-old-hires');
                    if (src && src.startsWith('http')) {
                        image = src;
                        break;
                    }
                }
            }
            
            // Disponibilité
            const availabilitySelectors = ['#availability span', '.a-color-success', '.a-color-state'];
            let availability = 'Disponibilité inconnue';
            for (const selector of availabilitySelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    availability = element.textContent.trim();
                    break;
                }
            }
            
            return { 
                title, 
                price, 
                priceElement, 
                image, 
                availability 
            };
        });
        
        log(`📊 Données extraites pour ${country}:`, {
            title: productData.title,
            rawPrice: productData.price,
            priceSelector: productData.priceElement
        }, 'debug');
        
        const cleanedPrice = cleanPrice(productData.price);
        if (!cleanedPrice) {
            throw new Error(`Prix non trouvé pour ${country}. Prix brut: "${productData.price}"`);
        }
        
        log(`✅ Prix nettoyé pour ${country}: ${cleanedPrice}€`, null, 'debug');
        
        return {
            country,
            title: productData.title,
            price: cleanedPrice,
            currency: '€',
            availability: productData.availability,
            image: productData.image,
            url: url,
            shipping: getShippingText(country)
        };
        
    } catch (error) {
        log(`❌ Erreur scraping ${country}: ${error.message}`, null, 'error');
        throw error;
    } finally {
        await browser.close();
    }
};

// ========== ROUTES API ==========

// Route 1: Recherche de produits
app.post('/api/search', async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    log(`🔍 [${requestId}] Recherche de produits`);
    
    try {
        const { query } = req.body;
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'Veuillez saisir un nom de produit' });
        }
        
        if (query.trim().length > 100) {
            return res.status(400).json({ error: 'Recherche trop longue (max 100 caractères)' });
        }
        
        // Cache de recherche
        const cacheKey = `search_${query.trim().toLowerCase()}`;
        const cachedResult = cache.get(cacheKey);
        
        if (cachedResult) {
            log(`💾 [${requestId}] Résultats de recherche en cache`);
            return res.json({ ...cachedResult, cached: true });
        }
        
        // Recherche dynamique
        const products = await searchProductsOnAmazon(query.trim());
        
        const response = {
            query: query.trim(),
            products: products,
            count: products.length,
            timestamp: new Date().toISOString()
        };
        
        // Mettre en cache la recherche
        cache.set(cacheKey, response, CONFIG.CACHE_DURATION);
        
        log(`✅ [${requestId}] ${products.length} produits trouvés pour "${query}"`);
        res.json(response);
        
    } catch (error) {
        log(`❌ [${requestId}] Erreur recherche: ${error.message}`, null, 'error');
        res.status(500).json({ 
            error: 'Erreur lors de la recherche',
            message: error.message 
        });
    }
});

// Route 2: Comparaison par ASIN
app.post('/api/compare/:asin', async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    const { asin } = req.params;
    
    log(`💰 [${requestId}] Comparaison pour ASIN: ${asin}`);
    
    try {
        if (!asin || !asin.match(/^[A-Z0-9]{10}$/)) {
            return res.status(400).json({ error: 'ASIN invalide' });
        }
        
        // Cache de comparaison
        const cacheKey = `compare_${asin}`;
        const cachedResult = cache.get(cacheKey);
        
        if (cachedResult) {
            log(`💾 [${requestId}] Comparaison en cache pour ${asin}`);
            return res.json({ ...cachedResult, cached: true });
        }
        
        // Comparaison dynamique
        const comparison = await compareProductByASIN(asin);
        const response = {
            ...comparison,
            timestamp: new Date().toISOString(),
            cached: false
        };
        
        // Mettre en cache
        cache.set(cacheKey, response, CONFIG.CACHE_DURATION);
        
        log(`✅ [${requestId}] Comparaison terminée: ${response.countries.length} pays`);
        res.json(response);
        
    } catch (error) {
        log(`❌ [${requestId}] Erreur comparaison: ${error.message}`, null, 'error');
        res.status(500).json({ 
            error: 'Erreur lors de la comparaison',
            message: error.message 
        });
    }
});

// Route 3: Récupérer l'historique des prix
app.get('/api/price-history/:asin', async (req, res) => {
    const { asin } = req.params;
    const { days = 30 } = req.query;
    
    if (!asin || !asin.match(/^[A-Z0-9]{10}$/)) {
        return res.status(400).json({ error: 'ASIN invalide' });
    }
    
    try {
        const rows = db.prepare(`
            SELECT 
                country, 
                price, 
                datetime(timestamp) as date,
                title,
                image_url,
                availability
            FROM price_history 
            WHERE asin = ? 
            AND timestamp >= datetime('now', '-${parseInt(days)} days')
            ORDER BY timestamp ASC
        `).all(asin);
        
        // Grouper par pays et formater les données
        const historyByCountry = {};
        let productInfo = null;
        
        rows.forEach(row => {
            // Garder les infos du produit
            if (!productInfo) {
                productInfo = {
                    title: row.title,
                    image: row.image_url
                };
            }
            
            // Grouper par pays
            if (!historyByCountry[row.country]) {
                historyByCountry[row.country] = [];
            }
            
            historyByCountry[row.country].push({
                price: row.price,
                date: row.date,
                availability: row.availability
            });
        });
        
        // Calculer les statistiques
        const stats = calculatePriceStats(historyByCountry);
        
        res.json({
            asin,
            productInfo,
            history: historyByCountry,
            stats: stats,
            totalRecords: rows.length,
            daysRequested: parseInt(days)
        });
    } catch (error) {
        log(`❌ Erreur route historique: ${error.message}`, null, 'error');
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Route 4: Obtenir les produits les plus suivis
app.get('/api/trending-products', async (req, res) => {
    const { limit = 10 } = req.query;
    
    try {
        const rows = db.prepare(`
            SELECT 
                asin,
                title,
                image_url,
                COUNT(*) as tracking_count,
                AVG(price) as avg_price,
                MIN(price) as min_price,
                MAX(price) as max_price
            FROM price_history 
            WHERE timestamp >= datetime('now', '-7 days')
            GROUP BY asin
            ORDER BY tracking_count DESC
            LIMIT ?
        `).all(parseInt(limit));
        
        res.json({
            trending: rows.map(row => ({
                asin: row.asin,
                title: row.title,
                image: row.image_url,
                trackingCount: row.tracking_count,
                avgPrice: Math.round(row.avg_price * 100) / 100,
                minPrice: row.min_price,
                maxPrice: row.max_price,
                priceRange: Math.round((row.max_price - row.min_price) * 100) / 100
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ========== NOUVELLES ROUTES API POUR LES ALERTES ==========

// Route 5: Créer une alerte prix
app.post('/api/alerts', async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    log(`🔔 [${requestId}] Création d'alerte`);
    
    try {
        const { asin, targetPrice, email, country, productName, productImage } = req.body;
        
        // Validation des données
        if (!asin || !targetPrice || !email || !country) {
            return res.status(400).json({ error: 'Données manquantes (asin, targetPrice, email, country requis)' });
        }
        
        if (!asin.match(/^[A-Z0-9]{10}$/)) {
            return res.status(400).json({ error: 'ASIN invalide' });
        }
        
        if (isNaN(targetPrice) || targetPrice <= 0) {
            return res.status(400).json({ error: 'Prix cible invalide' });
        }
        
        if (!email.includes('@')) {
            return res.status(400).json({ error: 'Email invalide' });
        }
        
        if (!['FR', 'DE', 'IT', 'ES'].includes(country)) {
            return res.status(400).json({ error: 'Pays invalide' });
        }
        
        // Vérifier si une alerte similaire existe déjà
        const existing = db.prepare(`
            SELECT id FROM price_alerts 
            WHERE asin = ? AND email = ? AND country = ? AND is_active = 1
        `).get(asin, email, country);
        
        if (existing) {
            return res.status(409).json({ error: 'Une alerte similaire existe déjà pour ce produit' });
        }
        
        // Créer l'alerte
        const result = db.prepare(`
            INSERT INTO price_alerts (asin, target_price, email, country, product_name, product_image)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(asin, targetPrice, email, country, productName, productImage);
        
        log(`✅ [${requestId}] Alerte créée avec ID ${result.lastInsertRowid}`);
        res.json({ 
            success: true, 
            alertId: result.lastInsertRowid,
            message: 'Alerte créée avec succès ! Vous recevrez un email si le prix baisse.'
        });
        
    } catch (error) {
        log(`❌ [${requestId}] Erreur globale: ${error.message}`, null, 'error');
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Route 6: Récupérer les alertes d'un utilisateur
app.get('/api/alerts/:email', async (req, res) => {
    const { email } = req.params;
    const { active = 'all' } = req.query;
    
    try {
        let query = `
            SELECT id, asin, target_price, country, product_name, product_image, 
                   created_at, is_active, triggered_at
            FROM price_alerts 
            WHERE email = ?
        `;
        
        const params = [email];
        
        if (active === 'true') {
            query += ' AND is_active = 1';
        } else if (active === 'false') {
            query += ' AND is_active = 0';
        }
        
        query += ' ORDER BY created_at DESC';
        
        const alerts = db.prepare(query).all(...params);
        
        const formattedAlerts = alerts.map(alert => ({
            id: alert.id,
            asin: alert.asin,
            targetPrice: alert.target_price,
            country: alert.country,
            countryName: getCountryData(alert.country).name,
            flag: getCountryData(alert.country).flag,
            productName: alert.product_name,
            productImage: alert.product_image,
            createdAt: alert.created_at,
            isActive: alert.is_active === 1,
            triggeredAt: alert.triggered_at
        }));
        
        res.json({
            alerts: formattedAlerts,
            totalActive: formattedAlerts.filter(a => a.isActive).length,
            totalTriggered: formattedAlerts.filter(a => !a.isActive).length
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Route 7: Supprimer une alerte
app.delete('/api/alerts/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = db.prepare(`DELETE FROM price_alerts WHERE id = ?`).run(id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Alerte non trouvée' });
        }
        
        res.json({ success: true, message: 'Alerte supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Route 8: Désactiver une alerte
app.patch('/api/alerts/:id/deactivate', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = db.prepare(`UPDATE price_alerts SET is_active = 0 WHERE id = ?`).run(id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Alerte non trouvée' });
        }
        
        res.json({ success: true, message: 'Alerte désactivée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        version: '4.1.0 - With better-sqlite3',
        timestamp: new Date().toISOString(),
        environment: CONFIG.NODE_ENV,
        features: {
            search: true,
            compare: true,
            priceHistory: true,
            priceAlerts: true
        },
        cache: {
            keys: cache.keys().length,
            stats: cache.getStats()
        }
    });
});

// Route de test recherche
app.get('/api/test-search/:query', async (req, res) => {
    try {
        const query = decodeURIComponent(req.params.query);
        log(`🧪 Test recherche: ${query}`);
        
        const products = await searchProductsOnAmazon(query);
        res.json({ success: true, query, products, count: products.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route de test comparaison
app.get('/api/test-compare/:asin', async (req, res) => {
    try {
        const { asin } = req.params;
        log(`🧪 Test comparaison: ${asin}`);
        
        const comparison = await compareProductByASIN(asin);
        res.json({ success: true, ...comparison });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route de test email (dev seulement)
if (CONFIG.NODE_ENV === 'development') {
    app.post('/api/test-email', async (req, res) => {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email requis' });
        }
        
        try {
            const testAlert = {
                email: email,
                product_name: 'Test Product - iPhone 15',
                product_image: 'https://via.placeholder.com/150',
                target_price: 999,
                country: 'FR',
                asin: 'B0TESTTEST'
            };
            
            const result = await sendPriceAlert(testAlert, 799, 200);
            res.json({ success: result, message: result ? 'Email envoyé' : 'Erreur envoi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// Nettoyage du cache (dev seulement)
if (CONFIG.NODE_ENV === 'development') {
    app.delete('/api/cache', (req, res) => {
        const keys = cache.keys();
        cache.flushAll();
        log(`🗑️ Cache vidé: ${keys.length} clés supprimées`);
        res.json({ success: true, deletedKeys: keys.length });
    });
}

// Gestion des erreurs
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

app.use((error, req, res, next) => {
    log('💥 Erreur globale:', error.message, 'error');
    console.error('Stack trace:', error);
    res.status(500).json({ 
        error: 'Erreur interne du serveur',
        message: CONFIG.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
});

// Fermer la base de données à l'arrêt du serveur
process.on('SIGINT', () => {
    log('🔌 Fermeture de la base de données...');
    try {
        db.close();
        log('✅ Base de données fermée');
    } catch (error) {
        log(`❌ Erreur fermeture DB: ${error.message}`, null, 'error');
    }
    process.exit(0);
});

// Test de configuration email au démarrage
if (CONFIG.EMAIL_USER && CONFIG.EMAIL_PASS) {
    log('✅ Configuration email trouvée');
} else {
    log('⚠️ Configuration email manquante - Alertes désactivées', null, 'warn');
}

app.listen(CONFIG.PORT, () => {
    log(`🚀 Serveur AmaCompare v4.1.0 AVEC ALERTES démarré sur le port ${CONFIG.PORT}`);
    log(`📡 API disponible sur http://localhost:${CONFIG.PORT}/api`);
    log(`🔍 Recherche: POST /api/search {"query": "nom produit"}`);
    log(`💰 Comparaison: POST /api/compare/:asin`);
    log(`📊 Historique: GET /api/price-history/:asin?days=30`);
    log(`🔥 Trending: GET /api/trending-products?limit=10`);
    log(`🔔 Créer alerte: POST /api/alerts`);
    log(`📧 Mes alertes: GET /api/alerts/:email`);
    log(`🗑️ Supprimer alerte: DELETE /api/alerts/:id`);
    log(`🏥 Health: GET /api/health`);
    log(`🧪 Test recherche: GET /api/test-search/[query]`);
    log(`🧪 Test comparaison: GET /api/test-compare/[asin]`);
    log(`✨ Base de données: better-sqlite3 (plus stable)`);
    log(`🔔 Système d'alertes: ${CONFIG.EMAIL_USER ? 'Activé' : 'Désactivé'}`);
});
