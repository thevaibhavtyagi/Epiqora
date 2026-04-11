/**
 * Epiqora - Home Page Script
 * Meticulously formatted logic for the landing page interactions.
 */

document.addEventListener('DOMContentLoaded', function() {
  setupMobileMenu();
  setupNavigationInteractions();
  setupCallToActionButtons();
  initializeScrollReveals();
});

/**
 * Handles the logic for the mobile Hamburger menu.
 * Toggles visibility and prevents scrolling when open.
 */
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (!mobileMenuBtn || !mainNav) return;

  // Toggle menu on button click
  mobileMenuBtn.addEventListener('click', function() {
    mainNav.classList.toggle('is-open');
    
    // Toggle the icon between bars and close (X)
    const icon = mobileMenuBtn.querySelector('i');
    if (mainNav.classList.contains('is-open')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    } else {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });

  // Close menu when a navigation link is clicked
  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      mainNav.classList.remove('is-open');
      
      // Reset icon back to bars
      const icon = mobileMenuBtn.querySelector('i');
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    });
  });
}

/**
 * Binds the CTA buttons to clear old storage data 
 * and cleanly route to the highly secure Upload App.
 */
function setupCallToActionButtons() {
  const ctaButtons = document.querySelectorAll('#startButton, #startButton2');
  
  ctaButtons.forEach(function(button) {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      
      // Clear legacy/existing session data for a fresh clinical start
      if (window.Storage && typeof window.Storage.clearAll === 'function') {
        window.Storage.clearAll();
      }
      
      // Proceed to the core upload module
      window.location.href = '/upload';
    });
  });
}

/**
 * Handles ultra-smooth scrolling logic for anchor links in the navigation bar.
 */
function setupNavigationInteractions() {
  const navigationLinks = document.querySelectorAll('.nav-link');
  
  navigationLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
      const targetId = link.getAttribute('href');
      
      // Only intercept if it's an anchor link (starts with #)
      if (targetId && targetId.startsWith('#')) {
        event.preventDefault();
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          // Adjust offset to account for the sticky glass header
          const headerOffset = 80; 
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

/**
 * Initiates the sleek IntersectionObserver to orchestrate 
 * the premium "fade and slide up" animations as elements enter the viewport.
 */
function initializeScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  
  // Configuration for when the animation should trigger
  const observerOptions = {
    root: null, // Viewport
    rootMargin: '0px',
    threshold: 0.15 // Triggers when 15% of the element is visible
  };
  
  const revealObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        // Add the class that triggers the CSS transition
        entry.target.classList.add('is-visible');
        
        // Unobserve to run the animation only once for performance
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Attach the observer to all elements
  revealElements.forEach(function(element) {
    revealObserver.observe(element);
  });
}
