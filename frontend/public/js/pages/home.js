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


function setupCallToActionButtons() {
  const ctaButtons = document.querySelectorAll('#startButton, #startButton2');
  
  ctaButtons.forEach(function(button) {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      
      if (window.Storage && typeof window.Storage.clearAll === 'function') {
        window.Storage.clearAll();
      }
      
      // Proceed to the core upload module
      window.location.href = '/upload';
    });
  });
}


function setupNavigationInteractions() {
  const navigationLinks = document.querySelectorAll('.nav-link');
  
  navigationLinks.forEach(function(link) {
    link.addEventListener('click', function(event) {
      const targetId = link.getAttribute('href');
      
      
      if (targetId && targetId.startsWith('#')) {
        event.preventDefault();
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          
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

function initializeScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  
  const observerOptions = {
    root: null, // Viewport
    rootMargin: '0px',
    threshold: 0.15
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
