/**
 * Epiqora - Global Footer Component
 * Consistent footer across all pages
 */

function loadFooter() {
  const footerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <a href="/" class="footer-logo">
              <span class="logo-text">Epiqora</span>
            </a>
            <span class="footer-tagline">Decode Your Skin. Elevate Your Routine.</span>
            <p class="footer-description">Advanced, data-driven AI skincare analysis designed for precision and personalized care.</p>
          </div>
          
          <div class="footer-column">
            <h4 class="footer-title">Quick Links</h4>
            <ul class="footer-links">
              <li><a href="/#features">Features</a></li>
              <li><a href="/#how-it-works">Methodology</a></li>
              <li><a href="/#trust">Our Commitment</a></li>
            </ul>
          </div>
          
          <div class="footer-column">
            <h4 class="footer-title">Legal & Support</h4>
            <ul class="footer-links">
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="footer-copyright">
            &copy; ${new Date().getFullYear()} Epiqora. All rights reserved. | Developer <a href="https://vaibhavtyagi.me" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline; text-underline-offset: 3px;">Vaibhav Tyagi</a>
            <br>
            <span style="opacity: 0.6; font-size: 0.85em; display: inline-block; margin-top: 8px;">
              Disclaimer: For cosmetic and informational purposes only. Not a certified medical device.
            </span>
          </p>
        </div>
      </div>
    </footer>
  `;

  // Find the main element to insert footer after it
  const mainElement = document.querySelector('main.main');
  
  if (mainElement) {
    mainElement.insertAdjacentHTML('afterend', footerHTML);
  } else {
    // Fallback: insert before closing body tag
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }
}

// Initialize when DOM is ready (only if no footer exists)
function initFooter() {
  // Check if footer already exists in the page
  const existingFooter = document.querySelector('footer.footer');
  if (!existingFooter) {
    loadFooter();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooter);
} else {
  initFooter();
}
