// Initialize the application
async function initialize() {
    try {
        // Load data
        await dataManager.loadData();
        
        // Initialize map with Mapbox token
        mapViz.initialize('pk.eyJ1IjoiYWx1a2FjaCIsImEiOiJ3US1JLXJnIn0.xrpBHCwvzsX76YlO-08kjg');
        
        // Add a small animated indicator to encourage scrolling
        setTimeout(() => {
            const storyContainer = document.getElementById('story');
            const scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll-indicator';
            scrollIndicator.innerHTML = '↓';
            document.querySelector('.story-intro').appendChild(scrollIndicator);
            
            // Auto-scroll slightly to show users they need to scroll
            setTimeout(() => {
                storyContainer.scrollTo({
                    top: 10,
                    behavior: 'smooth'
                });
                
                setTimeout(() => {
                    storyContainer.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }, 700);
            }, 1500);
        }, 2000);

    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

document.addEventListener('DOMContentLoaded', initialize);
