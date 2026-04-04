function loadHeader() {
  const headerHTML = `
    <header class="header">
      <div class="container">
        <div class="header-content">
          <a href="/" class="logo">
            <div class="logo-icon">
              <i class="fas fa-spa"></i>
            </div>
            <span class="logo-text">Dermora</span>
          </a>
          
          <button class="mobile-menu-toggle" id="mobileMenuBtn" aria-label="Toggle navigation menu">
            <i class="fas fa-bars"></i>
          </button>

          <nav class="nav" id="mainNav">
            <a href="/#features" class="nav-link">Features</a>
            <a href="/#how-it-works" class="nav-link">Methodology</a>
            <a href="/#trust" class="nav-link">Our Commitment</a>
          </nav>
        </div>
      </div>
    </header>
  `;

  document.body.insertAdjacentHTML('afterbegin', headerHTML);

  const btn = document.getElementById('mobileMenuBtn');
  const nav = document.getElementById('mainNav');

  if (btn && nav) {
    btn.addEventListener('click', () => {
      nav.classList.toggle('is-open');
    });
  }
}

document.addEventListener('DOMContentLoaded', loadHeader);