/**
 * Epiqora - Privacy Policy Script
 * Manages scroll-spy for the sticky sidebar and smooth header transitions.
 * Note: Header and Footer logic (including mobile menu) is handled globally via component scripts.
 */

document.addEventListener('DOMContentLoaded', function() {
  // We use a slight delay to ensure dynamic components (header.js) 
  // have fully injected into the DOM before calculating scroll offsets.
  setTimeout(() => {
    initializeLegalScrollSpy();
    setupSmoothScroll();
  }, 100);
});

/**
 * Initializes the scroll-spy logic.
 * Highlights the current active section in the table of contents as the user scrolls.
 */
function initializeLegalScrollSpy() {
  const sections = document.querySelectorAll('.policy-section');
  const navLinks = document.querySelectorAll('.toc-link');
  
  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-150px 0px -40% 0px', // Adjusted to trigger appropriately under the global header
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active class from all links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Find corresponding link and add active class
        const activeId = entry.target.getAttribute('id');
        const activeLink = document.querySelector(`.toc-link[href="#${activeId}"]`);
        
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/**
 * Ensures anchor links in the sidebar scroll smoothly to the target,
 * accounting for the fixed header height from your global component.
 */
function setupSmoothScroll() {
  const tocLinks = document.querySelectorAll('.toc-link');
  
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const headerOffset = 100; // Standard offset for your floating glass pill header
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}