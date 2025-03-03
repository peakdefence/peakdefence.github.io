// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
    // Fix: Use correct selector for mobile menu and navigation
    const mobileMenu = document.querySelector('.mobile-menu');
    const navElement = document.querySelector('nav');
    
    if (mobileMenu && navElement) {
        const mobileMenuToggle = document.querySelector('button[aria-label="Toggle menu"]');
        
        // If the toggle button already exists, just set up its event listener
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add active class to current nav item
const currentPath = window.location.pathname;
document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
    }
});

// Dark mode toggle
const darkModeToggle = document.querySelector('.dark-mode-toggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
    });

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'dark') {
        document.documentElement.classList.add('dark');
    }
}

// Search functionality
const searchInput = document.querySelector('.search-input');
if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) return;

        try {
            const response = await fetch('/index.json');
            const data = await response.json();
            
            const results = data.filter(page => 
                page.title.toLowerCase().includes(query) || 
                page.description.toLowerCase().includes(query)
            );

            displaySearchResults(results);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    });
}

function displaySearchResults(results) {
    const resultsContainer = document.querySelector('.search-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = results.map(result => `
        <a href="${result.permalink}" class="search-result">
            <h3>${result.title}</h3>
            <p>${result.description}</p>
        </a>
    `).join('');
}

// Intersection Observer for animations
const animatedElements = document.querySelectorAll('.animate-on-scroll');
if (animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1
    });

    animatedElements.forEach(element => observer.observe(element));
}

// Testimonial carousel functionality
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.testimonials-carousel');
    if (!carousel) return;
  
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    
    // Set initial state
    let currentSlide = 0;
    let autoplayInterval;
    
    // Initialize the carousel
    function initCarousel() {
      updateCarousel();
      startAutoplay();
      
      // Set up event listeners for dots
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          currentSlide = index;
          updateCarousel();
          restartAutoplay();
        });
      });
      
      // Reset on window resize
      window.addEventListener('resize', () => {
        updateCarousel();
      });
    }
    
    // Update the carousel display
    function updateCarousel() {
      // Move the track to show the current slide
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      
      // Update the dots
      dots.forEach((dot, index) => {
        dot.classList.toggle('bg-intelligence-blue', index === currentSlide);
        dot.classList.toggle('bg-gray-300', index !== currentSlide);
      });
    }
    
    // Start autoplay
    function startAutoplay() {
      autoplayInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
      }, 9000); // Change slide every 6 seconds
    }
    
    // Restart autoplay after user interaction
    function restartAutoplay() {
      clearInterval(autoplayInterval);
      startAutoplay();
    }
    
    // Initialize the carousel
    initCarousel();
  });

  // Header scroll effect
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    
    if (header) {
      const scrollThreshold = 100; // Adjust this value as needed
      
      // Apply initial state based on scroll position when page loads
      if (window.scrollY > scrollThreshold) {
        header.classList.add('header-scrolled');
      }
      
      // Listen for scroll events
      window.addEventListener('scroll', () => {
        if (window.scrollY > scrollThreshold) {
          header.classList.add('header-scrolled');
        } else {
          header.classList.remove('header-scrolled');
        }
      });
    }
  });