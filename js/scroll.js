class ScrollHandler {
    constructor() {
        this.sections = document.querySelectorAll('.story-section');
        this.currentSection = null;
        this.sectionChanged = false;
        this.initialize();
    }

    initialize() {
        const options = {
            root: document.querySelector('#story'),
            rootMargin: '-30% 0px', // Adjusted to be less aggressive
            threshold: 0.3 // Increased threshold to require more visibility
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Prevent section changes from interrupting user scrolling
                    if (!this.sectionChanged) {
                        this.handleSectionChange(entry.target);
                        // Set a debounce to prevent rapid section changes
                        this.sectionChanged = true;
                        setTimeout(() => {
                            this.sectionChanged = false;
                        }, 1000);
                    }
                }
            });
        }, options);

        this.sections.forEach(section => {
            observer.observe(section);
        });

        // Also initialize the year slider
        const slider = document.getElementById('year-slider');
        const yearDisplay = document.getElementById('current-year');
        
        slider.addEventListener('input', (e) => {
            const year = parseInt(e.target.value);
            yearDisplay.textContent = year;
            mapViz.updateData(year);
        });
        
        // Add smooth scrolling for the story container
        const storyContainer = document.getElementById('story');
        storyContainer.style.scrollBehavior = 'smooth';
    }

    handleSectionChange(section) {
        // Remove active class from all sections
        this.sections.forEach(s => s.classList.remove('active'));
        
        // Add active class to current section
        section.classList.add('active');
        this.currentSection = section;

        // Update year
        const year = parseInt(section.dataset.year);
        document.getElementById('year-slider').value = year;
        document.getElementById('current-year').textContent = year;

        // Get country data
        const country = section.dataset.country;
        
        // Don't fly to locations until we reach Sub-Saharan Africa
        if (country === 'sub-saharan-africa') {
            // Get location data for Sub-Saharan Africa
            const center = section.dataset.center.split(',').map(Number);
            const zoom = parseFloat(section.dataset.zoom || 2);
            
            // Stop globe spinning when we reach Sub-Saharan Africa
            mapViz.stopGlobeSpinning();
            
            // Update map view
            mapViz.flyToLocation(center, zoom);
        } else if (country !== 'global') {
            // For other specific countries (after Sub-Saharan Africa)
            const center = section.dataset.center.split(',').map(Number);
            const zoom = parseFloat(section.dataset.zoom || 2);
            
            // Update map view
            mapViz.flyToLocation(center, zoom);
        }
        
        // Always update data and highlight countries
        mapViz.updateData(year);
        
        // Highlight specific country if specified
        if (country) {
            // Make sure map is fully loaded before attempting to highlight
            if (mapViz.map) {
                if (!mapViz.map.loaded()) {
                    mapViz.map.once('idle', () => {
                        mapViz.highlightCountry(country);
                    });
                } else {
                    mapViz.highlightCountry(country);
                }
            }
        }
    }
}

const scrollHandler = new ScrollHandler();
