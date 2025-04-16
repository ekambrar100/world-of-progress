class MapVisualization {
    constructor() {
        this.currentYear = 1990;
        this.map = null;
        this.popup = null;
        this.highlightedCountry = null;
        this.isGlobeSpinning = false;
        this.spinInterval = null;
    }

    initialize(mapboxToken) {
        mapboxgl.accessToken = mapboxToken;
        
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [0, 20],
            zoom: 2,
            projection: 'globe'
        });

        // Remove all navigation controls
        const navControls = document.querySelectorAll('.mapboxgl-ctrl-top-left, .mapboxgl-ctrl-bottom-left');
        navControls.forEach(control => {
            control.style.display = 'none';
        });
        
        // Wait for map to load
        this.map.on('load', () => {
            this.map.setPaintProperty('background', 'background-color', '#f7f3ea');

            // Add country data layer
            this.map.addSource('countries', {
                type: 'vector',
                url: 'mapbox://mapbox.country-boundaries-v1'
            });
            
            // Add country fills layer
            this.map.addLayer({
                id: 'country-fills',
                type: 'fill',
                source: 'countries',
                'source-layer': 'country_boundaries',
                paint: {
                    'fill-color': '#8d6e63',
                    'fill-opacity': 0.7
                }
            });
            
            // Add highlight layer for countries
            this.map.addLayer({
                id: 'country-highlighted',
                type: 'line',
                source: 'countries',
                'source-layer': 'country_boundaries',
                paint: {
                    'line-color': '#f8f5e4',
                    'line-width': 2,
                    'line-opacity': ['case', ['boolean', ['feature-state', 'highlighted'], false], 1, 0]
                }
            });
            
            // Customize the map style
            this.customizeMapStyle();
            
            // Hide all attribution
            this.removeAttribution();
            
            // Initial data update
            this.updateData(1990);

            // Start the globe spinning for the intro
            this.startGlobeSpinning();
            
            // Fire the 'ready' event
            const event = new Event('map-ready');
            document.dispatchEvent(event);
        });
        
        // Add popup for country data
        this.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'country-popup'
        });
        
        // Add click event for countries
        this.map.on('click', 'country-fills', (e) => {
            const countryCode = e.features[0].properties.iso_3166_1_alpha_3;
            const countryData = dataManager.getCountryData(countryCode);
            
            if (countryData) {
                this.showCountryInfo(countryData, e.lngLat);
            }
        });
        
        // Change cursor on hover
        this.map.on('mouseenter', 'country-fills', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        
        this.map.on('mouseleave', 'country-fills', () => {
            this.map.getCanvas().style.cursor = '';
        });
    }
    
    removeAttribution() {
        // Remove all attribution elements
        const attribElements = document.querySelectorAll('.mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-geolocate, .mapboxgl-ctrl-zoom-in, .mapboxgl-ctrl-zoom-out, .mapboxgl-ctrl, .mapboxgl-ctrl-icon, .mapbox-improve-map');
        attribElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Also add a MutationObserver to handle attribution that might be added later
        const observer = new MutationObserver((mutations) => {
            const attribElements = document.querySelectorAll('.mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-geolocate, .mapboxgl-ctrl-zoom-in, .mapboxgl-ctrl-zoom-out, .mapboxgl-ctrl, .mapboxgl-ctrl-icon, .mapbox-improve-map');
            attribElements.forEach(el => {
                el.style.display = 'none';
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Add additional CSS rule to ensure attributions stay hidden
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
            .mapboxgl-ctrl-attrib, 
            .mapboxgl-ctrl-logo, 
            .mapboxgl-ctrl-bottom-right, 
            .mapboxgl-ctrl-bottom-left,
            .mapboxgl-ctrl-geolocate,
            .mapboxgl-ctrl-zoom-in,
            .mapboxgl-ctrl-zoom-out,
            .mapboxgl-ctrl,
            .mapboxgl-ctrl-icon,
            .mapbox-improve-map {
                display: none !important;
            }
            
            /* Hide any arrows or navigation controls */
            .mapboxgl-ctrl-nav-arrow,
            .mapboxgl-ctrl-compass-arrow,
            .mapboxgl-ctrl-compass,
            .mapboxgl-ctrl-attrib-button,
            .mapboxgl-ctrl-attrib-inner {
                display: none !important;
            }
        `;
        document.head.appendChild(styleTag);
    }

    customizeMapStyle() {
        // Change all labels to use Spectral font
        const layers = this.map.getStyle().layers;
        for (const layer of layers) {
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                this.map.setLayoutProperty(layer.id, 'text-font', ['Spectral Regular', 'Open Sans Regular']);
                
                // Make labels more visible
                if (layer.id.includes('label')) {
                    this.map.setPaintProperty(layer.id, 'text-color', '#5d4037');
                    this.map.setPaintProperty(layer.id, 'text-halo-color', 'rgba(245, 235, 220, 0.8)');
                    this.map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
                }
            }
        }
        
        // Change water color to a sepia tone
        this.map.setPaintProperty('water', 'fill-color', '#e8e0d4'); // More sepia-toned water
        
        // Adjust land color to match text section
        this.map.setPaintProperty('land', 'fill-color', '#f0e8d8'); // Darker parchment color
        
        // Add a background to match the text area's sepia tone
        this.map.setPaintProperty('background', 'background-color', '#f5efe0'); // Sepia background
    }

    startGlobeSpinning() {
        if (this.isGlobeSpinning) return;
        
        this.isGlobeSpinning = true;
        const startingLng = this.map.getCenter().lng;
        let currentLng = startingLng;
        
        this.spinInterval = setInterval(() => {
            currentLng = (currentLng + 0.5) % 360;
            this.map.setCenter([currentLng, this.map.getCenter().lat]);
        }, 100);
    }
    
    stopGlobeSpinning() {
        if (!this.isGlobeSpinning) return;
        
        this.isGlobeSpinning = false;
        if (this.spinInterval) {
            clearInterval(this.spinInterval);
            this.spinInterval = null;
        }
    }

    flyToLocation(center, zoom) {
        // Only stop globe spinning for specific country views
        // This allows it to keep spinning for global views
        if (zoom > 2) {
            this.stopGlobeSpinning();
        }
        
        this.map.flyTo({
            center: center,
            zoom: zoom,
            duration: 2000,
            essential: true
        });
    }

    showCountryInfo(countryData, lngLat) {
        const data1990 = countryData.values.find(v => v.year === 1990)?.value;
        const data2022 = countryData.values.find(v => v.year === 2022)?.value;
        
        if (!data1990 || !data2022) {
            console.warn(`Missing data for country: ${countryData.name}`);
            return;
        }
        
        const change = data1990 - data2022;
        const percentChange = ((data1990 - data2022) / data1990 * 100).toFixed(1);
        
        const html = `
            <h3>${countryData.name}</h3>
            <p><strong>1990:</strong> ${data1990.toFixed(1)}</p>
            <p><strong>2022:</strong> ${data2022.toFixed(1)}</p>
            <p><strong>Change:</strong> ${change.toFixed(1)} (${percentChange}%)</p>
        `;
        
        this.popup
            .setLngLat(lngLat)
            .setHTML(html)
            .addTo(this.map);
            
        // Auto-close the popup after 5 seconds
        setTimeout(() => {
            this.popup.remove();
        }, 5000);
    }

    highlightCountry(countryCode) {
        // Remove previous highlight
        if (this.highlightedCountry) {
            this.map.setFeatureState(
                { source: 'countries', sourceLayer: 'country_boundaries', id: this.highlightedCountry },
                { highlighted: false }
            );
        }

        // Only stop spinning for Sub-Saharan Africa or specific countries (not global)
        if (countryCode === 'global') {
            // For global view, start spinning the globe
            this.startGlobeSpinning();
            this.highlightedCountry = null;
            return;
        }

        // If highlighting a region (Africa, Latin America), handle it differently
        if (countryCode === 'africa' || countryCode === 'sub-saharan-africa') {
            // Stop spinning only for Sub-Saharan Africa
            this.stopGlobeSpinning();
            this.highlightRegion(dataManager.getCountriesInRegion('sub-saharan-africa'));
            return;
        } else if (countryCode === 'latinAmerica') {
            this.stopGlobeSpinning();
            this.highlightRegion(dataManager.getCountriesInRegion('latinAmerica'));
            return;
        }

        // Stop the globe spinning for specific country views
        this.stopGlobeSpinning();

        // Highlight a specific country
        const features = this.map.querySourceFeatures('countries', {
            sourceLayer: 'country_boundaries',
            filter: ['==', ['get', 'iso_3166_1_alpha_3'], countryCode]
        });

        if (features.length > 0) {
            const featureId = features[0].id;
            this.map.setFeatureState(
                { source: 'countries', sourceLayer: 'country_boundaries', id: featureId },
                { highlighted: true }
            );
            this.highlightedCountry = featureId;
        }
    }

    highlightRegion(countryCodes) {
        // Stop the globe spinning for region views
        this.stopGlobeSpinning();
        
        // Clear any existing highlight
        if (this.highlightedCountry) {
            this.map.setFeatureState(
                { source: 'countries', sourceLayer: 'country_boundaries', id: this.highlightedCountry },
                { highlighted: false }
            );
            this.highlightedCountry = null;
        }
        
        // Highlight each country in the region
        countryCodes.forEach(code => {
            const features = this.map.querySourceFeatures('countries', {
                sourceLayer: 'country_boundaries',
                filter: ['==', ['get', 'iso_3166_1_alpha_3'], code]
            });
            
            if (features.length > 0) {
                const featureId = features[0].id;
                this.map.setFeatureState(
                    { source: 'countries', sourceLayer: 'country_boundaries', id: featureId },
                    { highlighted: true }
                );
            }
        });
    }

    updateData(year) {
        this.currentYear = year;
        const data = dataManager.getDataForYear(year);
        
        // Update the fill color based on mortality rate with historical color scheme
        this.map.setPaintProperty('country-fills', 'fill-color', [
            'case',
            ['has', ['get', 'iso_3166_1_alpha_3'], ['literal', this.createDataLookup(data)]],
            [
                'interpolate',
                ['linear'],
                ['get', ['get', 'iso_3166_1_alpha_3'], ['literal', this.createDataLookup(data)]],
                0, '#efebe9',   // Lowest (best) values get lightest color
                20, '#d7ccc8',  
                40, '#bcaaa4',  
                60, '#a1887f',  
                80, '#8d6e63',  
                100, '#795548', 
                120, '#6d4c41',  
                150, '#5d4037'  // Highest (worst) values get darkest color
            ],
            '#8d6e63' // Default color for countries with no data
        ]);
    }

    createDataLookup(data) {
        return Object.fromEntries(
            data.map(d => [d.code, d.value])
        );
    }
}

// Create global instance
const mapViz = new MapVisualization();
