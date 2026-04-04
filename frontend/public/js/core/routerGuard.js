/**
 * Dermora Pro - Enhanced Router Guard
 * Intelligently handles extension-less backend routes while 
 * ensuring users cannot skip steps in the analysis flow.
 */

const RouterGuard = {
  /**
   * Define the flow sequence using clean route names
   */
  FLOW: [
    { page: 'index', step: 'home', requiresPrevious: null },
    { page: 'upload', step: 'upload', requiresPrevious: null },
    { page: 'analysis', step: 'analysis', requiresPrevious: 'upload' },
    { page: 'questions', step: 'questions', requiresPrevious: 'analysis' },
    { page: 'report', step: 'report', requiresPrevious: 'questions' },
  ],

  /**
   * Get current page name, intelligently stripping '.html' if present
   */
  getCurrentPage() {
    let path = window.location.pathname.split('/').pop();
    if (!path || path === '') return 'index';
    return path.replace('.html', '');
  },

  /**
   * Get flow data for a page
   */
  getFlowData(page) {
    return this.FLOW.find(item => item.page === page);
  },

  /**
   * Check if user can access a page based on completion history
   */
  canAccess(page) {
    const flowData = this.getFlowData(page);
    
    // If page is not in flow or requires no previous step, allow access
    if (!flowData || !flowData.requiresPrevious) {
      return true;
    }

    // Safely check if the required previous step is completed in Storage
    if (typeof Storage !== 'undefined' && typeof Storage.hasCompleted === 'function') {
      return Storage.hasCompleted(flowData.requiresPrevious);
    }
    
    return true; // Fallback allowance if Storage hasn't loaded yet
  },

  /**
   * Guard a page - redirect if user doesn't have access
   */
  guardPage() {
    const currentPage = this.getCurrentPage();
    
    if (!this.canAccess(currentPage)) {
      console.warn(`[RouterGuard] Security check failed for /${currentPage}. Redirecting to secure checkpoint.`);
      window.location.href = '/upload';
    }
  },

  /**
   * Safely calculate the next page in the sequence
   */
  getNextPage() {
    const currentPage = this.getCurrentPage();
    const currentIndex = this.FLOW.findIndex(item => item.page === currentPage);
    
    // If found and not the last page, return next page
    if (currentIndex !== -1 && currentIndex < this.FLOW.length - 1) {
      return this.FLOW[currentIndex + 1].page;
    }
    
    return currentPage; // Stay on current page if at the end or not found
  },

  /**
   * Safely calculate the previous page in the sequence
   */
  getPreviousPage() {
    const currentPage = this.getCurrentPage();
    const currentIndex = this.FLOW.findIndex(item => item.page === currentPage);
    
    if (currentIndex > 0) {
      return this.FLOW[currentIndex - 1].page;
    }
    
    return 'index'; // Default fallback to home
  },

  /**
   * Securely navigate to next step using clean URLs
   */
  goNext() {
    const nextPage = this.getNextPage();
    window.location.href = `/${nextPage}`;
  },

  /**
   * Navigate to previous step
   */
  goPrevious() {
    const prevPage = this.getPreviousPage();
    window.location.href = `/${prevPage}`;
  },

  /**
   * Wipe all session data and hard-reset the application flow
   */
  resetFlow() {
    if (typeof Storage !== 'undefined' && typeof Storage.clearAll === 'function') {
      Storage.clearAll();
    }
    window.location.href = '/upload';
  }
};

// Initialize router guard on DOM load
document.addEventListener('DOMContentLoaded', () => {
  RouterGuard.guardPage();
});