// Welcome popup functionality
function showWelcomePopup() {
    const popup = document.getElementById('welcome-popup');
    document.body.classList.add('popup-active');
    popup.classList.remove('hidden');
}

function closeWelcomePopup() {
    const popup = document.getElementById('welcome-popup');
    document.body.classList.remove('popup-active');
    popup.classList.add('hidden');
}

// Show popup when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(showWelcomePopup, 500);
    
    // Close popup when clicking overlay
    const overlay = document.querySelector('.popup-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeWelcomePopup);
    }
});

// Search functionality
function performSearch() {
    const searchInput = document.getElementById('search-input').value.trim().toLowerCase();
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput) {
        searchResults.classList.remove('active');
        return;
    }
    
    // Search through the fileDatabase (loaded from file-database.js)
    const results = fileDatabase.filter(file => {
        // Check if search term matches any keyword
        return file.keywords.some(keyword => keyword.includes(searchInput));
    });
    
    // Display results
    if (results.length > 0) {
        searchResults.innerHTML = `
            <div class="results-header">
                <span>${results.length} result${results.length > 1 ? 's' : ''} found</span>
            </div>
            <div class="results-list">
                ${results.map(result => {
                    const isDownload = result.brand === 'Flash Tools' && result.path.match(/\.(rar|zip|7z)$/i);
                    const icon = isDownload ? '📥' : '📁';
                    const brandClass = result.brand === 'Flash Tools' ? 'flash-tools-brand' : '';
                    return `
                        <div class="result-item" onclick='openFileLocation("${result.fullPath || result.path}")'>
                            <div class="result-main">
                                <span class="result-icon">${icon}</span>
                                <span class="result-name">${result.name}</span>
                                <span class="result-brand ${brandClass}">${result.brand}</span>
                            </div>
                            ${result.chipset ? `<span class="result-chip">${result.chipset}</span>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        // Check if user is searching for tools
        const toolKeywords = ['flashtool', 'flash', 'tool', 'tools', 'flash tool', 'flashtools'];
        const isToolSearch = toolKeywords.some(keyword => searchInput.includes(keyword));
        
        if (isToolSearch) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <p>🔧 Tools coming soon</p>
                </div>
            `;
        } else {
            searchResults.innerHTML = `
                <div class="no-results">
                    <p>No results found for "${searchInput}"</p>
                </div>
            `;
        }
    }
    
    searchResults.classList.add('active');
}

// Open file location in file explorer or download file
function openFileLocation(filePath) {
    // Check if this is a Google Drive link
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Open Google Drive download link in new tab
        window.open(filePath, '_blank');
        return;
    }
    
    // For local paths (fallback)
    const fullPath = filePath.includes(':\\') ? filePath : `${baseFolderPath}\\${filePath}`;
    
    // Check if this is a downloadable file (Flash Tools)
    if (filePath.includes('Flash Tools') && (filePath.endsWith('.rar') || filePath.endsWith('.zip') || filePath.endsWith('.7z'))) {
        alert(`📥 Download: ${filePath.split('\\').pop()}\n\nFile Location: ${fullPath}\n\n💡 This is a downloadable archive file.\nPath copied to clipboard for manual download.`);
    } else {
        alert(`📁 File Location:\n${fullPath}\n\n💡 Path copied to clipboard.`);
    }
    
    // Try to copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(fullPath).then(() => {
            console.log('Path copied to clipboard');
        }).catch(err => {
            console.error('Could not copy path:', err);
        });
    }
}

// Allow Enter key to trigger search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Also search as user types (debounced)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 300);
        });
    }
});

// Modal Functions
function openTool(toolId) {
    document.getElementById(toolId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeTool(toolId) {
    document.getElementById(toolId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// IMEI Checker
function checkIMEI() {
    const imei = document.getElementById('imei-input').value.trim();
    const resultDiv = document.getElementById('imei-result');
    
    if (!imei) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Error:</strong> Please enter an IMEI number.';
        return;
    }
    
    if (imei.length !== 15) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Invalid:</strong> IMEI must be exactly 15 digits.';
        return;
    }
    
    if (!/^\d+$/.test(imei)) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Invalid:</strong> IMEI must contain only numbers.';
        return;
    }
    
    // Luhn algorithm for IMEI validation
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = imei.length - 1; i >= 0; i--) {
        let digit = parseInt(imei[i]);
        
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    
    const isValid = (sum % 10 === 0);
    
    if (isValid) {
        resultDiv.className = 'result success';
        resultDiv.innerHTML = `
            <strong>✓ Valid IMEI</strong><br>
            IMEI: ${imei}<br>
            TAC (Type Allocation Code): ${imei.substring(0, 8)}<br>
            SNR (Serial Number): ${imei.substring(8, 14)}<br>
            CD (Check Digit): ${imei[14]}
        `;
    } else {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>✗ Invalid IMEI:</strong> This IMEI failed validation check.';
    }
}

// Screen Info Calculator
function calculateScreen() {
    const width = parseFloat(document.getElementById('screen-width').value);
    const height = parseFloat(document.getElementById('screen-height').value);
    const size = parseFloat(document.getElementById('screen-size').value);
    const resultDiv = document.getElementById('screen-result');
    
    if (!width || !height || !size) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Error:</strong> Please fill all fields.';
        return;
    }
    
    // Calculate diagonal in pixels
    const diagonalPixels = Math.sqrt(width * width + height * height);
    
    // Calculate PPI
    const ppi = Math.round(diagonalPixels / size);
    
    // Calculate aspect ratio
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    const aspectWidth = width / divisor;
    const aspectHeight = height / divisor;
    
    // Determine resolution category
    let category;
    if (height >= 2400) category = 'QHD+ / 2K+';
    else if (height >= 2160) category = 'Full HD+ / 2K';
    else if (height >= 1920) category = 'Full HD';
    else if (height >= 1280) category = 'HD+';
    else category = 'HD';
    
    resultDiv.className = 'result success';
    resultDiv.innerHTML = `
        <strong>Screen Specifications:</strong><br>
        Resolution: ${width} × ${height} pixels<br>
        PPI (Pixels Per Inch): ${ppi}<br>
        Aspect Ratio: ${aspectWidth}:${aspectHeight}<br>
        Category: ${category}<br>
        Total Pixels: ${(width * height / 1000000).toFixed(2)} megapixels
    `;
}

// Battery Health Calculator
function calculateBattery() {
    const designCapacity = parseFloat(document.getElementById('design-capacity').value);
    const currentCapacity = parseFloat(document.getElementById('current-capacity').value);
    const resultDiv = document.getElementById('battery-result');
    
    if (!designCapacity || !currentCapacity) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Error:</strong> Please fill all fields.';
        return;
    }
    
    if (currentCapacity > designCapacity) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Error:</strong> Current capacity cannot exceed design capacity.';
        return;
    }
    
    const healthPercentage = ((currentCapacity / designCapacity) * 100).toFixed(1);
    const degradation = (100 - healthPercentage).toFixed(1);
    
    let status, className;
    if (healthPercentage >= 90) {
        status = 'Excellent';
        className = 'success';
    } else if (healthPercentage >= 80) {
        status = 'Good';
        className = 'success';
    } else if (healthPercentage >= 70) {
        status = 'Fair';
        className = 'info';
    } else {
        status = 'Poor - Consider replacement';
        className = 'error';
    }
    
    resultDiv.className = `result ${className}`;
    resultDiv.innerHTML = `
        <strong>Battery Health: ${healthPercentage}%</strong><br>
        Status: ${status}<br>
        Design Capacity: ${designCapacity} mAh<br>
        Current Capacity: ${currentCapacity} mAh<br>
        Degradation: ${degradation}%<br>
        Capacity Lost: ${(designCapacity - currentCapacity).toFixed(0)} mAh
    `;
}

// Storage Calculator
function calculateStorage() {
    const advertised = parseFloat(document.getElementById('advertised-storage').value);
    const resultDiv = document.getElementById('storage-result');
    
    if (!advertised) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Error:</strong> Please enter advertised storage.';
        return;
    }
    
    // Convert GB to GiB (binary)
    const actualGiB = advertised * (1000 * 1000 * 1000) / (1024 * 1024 * 1024);
    
    // System usually takes 10-20GB depending on phone
    let systemSpace;
    if (advertised <= 64) systemSpace = 12;
    else if (advertised <= 128) systemSpace = 15;
    else if (advertised <= 256) systemSpace = 18;
    else systemSpace = 20;
    
    const availableSpace = actualGiB - systemSpace;
    
    resultDiv.className = 'result info';
    resultDiv.innerHTML = `
        <strong>Storage Breakdown:</strong><br>
        Advertised: ${advertised} GB<br>
        Actual (Binary): ${actualGiB.toFixed(2)} GiB<br>
        System Files: ~${systemSpace} GB<br>
        <strong>Available to User: ~${availableSpace.toFixed(2)} GB</strong><br><br>
        <em>Note: Actual available space may vary by device and Android version.</em>
    `;
}

// Color Finder
function findColor() {
    const brand = document.getElementById('phone-brand').value;
    const colorName = document.getElementById('color-name').value.trim().toLowerCase();
    const resultDiv = document.getElementById('color-result');
    
    if (!brand || !colorName) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Error:</strong> Please select a brand and enter a color name.';
        return;
    }
    
    // Common phone colors database
    const colorDatabase = {
        'midnight black': '#000000',
        'space black': '#1a1a1a',
        'starry black': '#0d0d0d',
        'cosmic black': '#111111',
        'phantom black': '#1c1c1c',
        'obsidian black': '#0a0a0a',
        'midnight blue': '#191970',
        'navy blue': '#000080',
        'ocean blue': '#006994',
        'sky blue': '#87ceeb',
        'aurora blue': '#4682b4',
        'pearl white': '#f8f8ff',
        'snow white': '#fffafa',
        'moonlight white': '#f5f5f5',
        'ceramic white': '#fafafa',
        'frost white': '#f0f8ff',
        'sunset gold': '#ffd700',
        'champagne gold': '#f7e7ce',
        'rose gold': '#b76e79',
        'premium gold': '#daa520',
        'aurora green': '#00a86b',
        'forest green': '#228b22',
        'mint green': '#98ff98',
        'emerald green': '#50c878',
        'silver': '#c0c0c0',
        'space silver': '#d3d3d3',
        'lunar silver': '#bcc6cc',
        'starlight silver': '#e5e4e2',
        'red': '#ff0000',
        'sunrise red': '#dc143c',
        'cherry red': '#d2042d',
        'phoenix red': '#c41e3a',
        'purple': '#800080',
        'violet': '#8b00ff',
        'lavender': '#e6e6fa',
        'cosmic purple': '#7b3f8b',
        'orange': '#ff6600',
        'sunset orange': '#ff7f50',
        'pink': '#ffc0cb',
        'blossom pink': '#ffb6c1',
        'sakura pink': '#ffb7c5'
    };
    
    if (colorDatabase[colorName]) {
        const hexCode = colorDatabase[colorName];
        resultDiv.className = 'result success';
        resultDiv.innerHTML = `
            <strong>Color Found!</strong><br>
            Color Name: ${colorName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}<br>
            Hex Code: ${hexCode}<br>
            <div class="color-preview" style="background-color: ${hexCode};"></div>
        `;
    } else {
        resultDiv.className = 'result info';
        resultDiv.innerHTML = `
            <strong>Color not found in database</strong><br>
            Try common color names like:<br>
            • Midnight Black<br>
            • Pearl White<br>
            • Aurora Blue<br>
            • Rose Gold<br>
            • Emerald Green
        `;
    }
}

// Network Bands Checker
function checkBands() {
    const networkType = document.getElementById('network-type').value;
    const region = document.getElementById('region').value;
    const resultDiv = document.getElementById('bands-result');
    
    if (!networkType || !region) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>Error:</strong> Please select both network type and region.';
        return;
    }
    
    const bandData = {
        '4g': {
            'india': {
                bands: ['B3 (1800 MHz)', 'B5 (850 MHz)', 'B8 (900 MHz)', 'B40 (2300 MHz)', 'B41 (2500 MHz)'],
                description: 'Primary bands used by Jio, Airtel, Vi in India'
            },
            'usa': {
                bands: ['B2 (1900 MHz)', 'B4 (1700/2100 MHz)', 'B5 (850 MHz)', 'B12 (700 MHz)', 'B66 (1700/2100 MHz)'],
                description: 'Major carriers: AT&T, Verizon, T-Mobile'
            },
            'europe': {
                bands: ['B3 (1800 MHz)', 'B7 (2600 MHz)', 'B8 (900 MHz)', 'B20 (800 MHz)'],
                description: 'Primary bands across European countries'
            },
            'china': {
                bands: ['B1 (2100 MHz)', 'B3 (1800 MHz)', 'B5 (850 MHz)', 'B8 (900 MHz)', 'B38 (2600 MHz)', 'B39 (1900 MHz)', 'B40 (2300 MHz)', 'B41 (2500 MHz)'],
                description: 'China Mobile, China Unicom, China Telecom'
            },
            'sea': {
                bands: ['B1 (2100 MHz)', 'B3 (1800 MHz)', 'B5 (850 MHz)', 'B7 (2600 MHz)', 'B8 (900 MHz)', 'B40 (2300 MHz)'],
                description: 'Common across Thailand, Malaysia, Singapore, Philippines, Indonesia'
            }
        },
        '5g': {
            'india': {
                bands: ['N1 (2100 MHz)', 'N3 (1800 MHz)', 'N5 (850 MHz)', 'N8 (900 MHz)', 'N28 (700 MHz)', 'N78 (3500 MHz)'],
                description: '5G NSA and SA deployment by Jio and Airtel'
            },
            'usa': {
                bands: ['N2 (1900 MHz)', 'N5 (850 MHz)', 'N41 (2500 MHz)', 'N66 (1700/2100 MHz)', 'N71 (600 MHz)', 'N77 (3700 MHz)', 'N260 (39 GHz)', 'N261 (28 GHz)'],
                description: 'Sub-6 GHz and mmWave bands'
            },
            'europe': {
                bands: ['N1 (2100 MHz)', 'N3 (1800 MHz)', 'N7 (2600 MHz)', 'N28 (700 MHz)', 'N78 (3500 MHz)'],
                description: 'Primary 5G bands in EU countries'
            },
            'china': {
                bands: ['N1 (2100 MHz)', 'N3 (1800 MHz)', 'N5 (850 MHz)', 'N8 (900 MHz)', 'N41 (2500 MHz)', 'N78 (3500 MHz)', 'N79 (4500 MHz)'],
                description: 'Extensive 5G network coverage'
            },
            'sea': {
                bands: ['N1 (2100 MHz)', 'N3 (1800 MHz)', 'N5 (850 MHz)', 'N8 (900 MHz)', 'N28 (700 MHz)', 'N78 (3500 MHz)'],
                description: '5G rollout in progress across SEA region'
            }
        }
    };
    
    const data = bandData[networkType][region];
    
    resultDiv.className = 'result success';
    resultDiv.innerHTML = `
        <div class="band-list">
            <strong>${networkType.toUpperCase()} Bands for ${region === 'usa' ? 'USA' : region === 'sea' ? 'Southeast Asia' : region.charAt(0).toUpperCase() + region.slice(1)}</strong>
            <h4>Required Bands:</h4>
            <ul>
                ${data.bands.map(band => `<li>${band}</li>`).join('')}
            </ul>
            <p style="margin-top: 1rem;"><em>${data.description}</em></p>
            <p style="margin-top: 1rem; color: #666;"><strong>Note:</strong> Your phone should support most of these bands for optimal coverage.</p>
        </div>
    `;
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Input validation - only numbers for certain fields
document.addEventListener('DOMContentLoaded', function() {
    const numericInputs = ['imei-input', 'screen-width', 'screen-height', 'screen-size', 
                          'design-capacity', 'current-capacity', 'advertised-storage'];
    
    numericInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && input.type === 'text') {
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }
    });
});
