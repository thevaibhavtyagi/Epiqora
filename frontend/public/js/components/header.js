/**
 * Epiqora - Global Header Component
 * Premium floating glassmorphism header with smooth transitions
 */

function loadHeader() {
  const headerHTML = `
    <header class="header" id="siteHeader">
      <div class="container">
        <div class="header-content">
          <a href="/" class="logo">
            <span class="logo-text">Epiqora</span>
          </a>
          
          <nav class="nav" id="mainNav">
            <a href="/#features" class="nav-link">Features</a>
            <a href="/#how-it-works" class="nav-link">Methodology</a>
            <a href="/#trust" class="nav-link">Our Commitment</a>
          </nav>

          <button class="mobile-menu-toggle" id="mobileMenuBtn" aria-label="Toggle navigation menu" aria-expanded="false">
            <span class="hamburger">
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  `;

  // Inject header into the DOM
  document.body.insertAdjacentHTML('afterbegin', headerHTML);

  // Cache DOM elements
  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('mainNav');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = nav.querySelectorAll('.nav-link');

  // State
  let isMenuOpen = false;
  let ticking = false;

  // ========================================
  // Scroll-based header transformation
  // ========================================
  function updateHeaderState() {
    const scrollY = window.scrollY;
    const threshold = 80;
    
    if (scrollY > threshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderState);
      ticking = true;
    }
  }

  // ========================================
  // Mobile Menu Functions
  // ========================================
  function openMenu() {
    isMenuOpen = true;
    nav.classList.add('is-open');
    mobileBtn.classList.add('is-active');
    mobileBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    isMenuOpen = false;
    nav.classList.remove('is-open');
    mobileBtn.classList.remove('is-active');
    mobileBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMenu(e) {
    e.stopPropagation();
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // ========================================
  // Smooth Scroll for Anchor Links
  // ========================================
  function handleNavClick(e) {
    const href = e.currentTarget.getAttribute('href');
    
    // Close mobile menu first
    if (isMenuOpen) {
      closeMenu();
    }

    // Handle same-page anchor links
    if (href.startsWith('/#')) {
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
      
      if (isHomePage) {
        e.preventDefault();
        const targetId = href.substring(2); 
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const headerOffset = 100;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  }

  // ========================================
  // Keyboard Accessibility
  // ========================================
  function handleKeydown(e) {
    if (e.key === 'Escape' && isMenuOpen) {
      closeMenu();
      mobileBtn.focus();
    }
  }

  // ========================================
  // Event Listeners
  // ========================================
  window.addEventListener('scroll', onScroll, { passive: true });
  mobileBtn.addEventListener('click', toggleMenu);
  document.addEventListener('keydown', handleKeydown);

  navLinks.forEach(link => {
    link.addEventListener('click', handleNavClick);
  });

  // Initialize header state on load
  updateHeaderState();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadHeader);
} else {
  loadHeader();
}
