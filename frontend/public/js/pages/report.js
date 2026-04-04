/**
 * DermAI Pro - Report Page Script
 * Displays personalized skincare report with analysis and recommendations
 */

const ReportPage = {
  // State
  state: {
    report: null,
    analysis: null,
    answers: null,
    isLoading: true,
    hasError: false,
  },

  // DOM elements cache
  elements: {
    loading: null,
    content: null,
    error: null,
    container: null,
    actions: null,
    errorMessage: null,
    retryButton: null,
    downloadButton: null,
    newAnalysisButton: null,
    printButton: null,
    chatToggle: null,
  },

  /**
   * Initialize the page on load
   */
  async init() {
    console.log('[Report] Initializing report page');

    // Cache DOM elements
    this.cacheElements();

    // Guard page access
    RouterGuard.guardPage();

    // Load report data
    await this.loadReport();

    // Setup event listeners
    this.setupEventListeners();
  },

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements.loading = document.getElementById('reportLoading');
    this.elements.content = document.getElementById('reportContent');
    this.elements.error = document.getElementById('reportError');
    this.elements.container = document.getElementById('reportContainer');
    this.elements.actions = document.getElementById('reportActions');
    this.elements.errorMessage = document.getElementById('errorMessage');
    this.elements.retryButton = document.getElementById('retryButton');
    this.elements.downloadButton = document.getElementById('downloadButton');
    this.elements.newAnalysisButton = document.getElementById('newAnalysisButton');
    this.elements.printButton = document.getElementById('printButton');
    this.elements.chatToggle = document.getElementById('chatToggle');
  },

  /**
   * Load report data from storage and API
   */
  async loadReport() {
    try {
      console.log('[Report] Loading report data');

      const rawReportData = Storage.getReport();
      const analysisData = Storage.getAnalysis();
      const answersData = Storage.getAnswers();

      if (!rawReportData) {
        throw new Error('No report data found');
      }

      // --- BULLETPROOF REPORT PARSER ---
      let parsedReport = rawReportData;
      
      if (typeof rawReportData === 'string') {
        try {
          parsedReport = JSON.parse(rawReportData.replace(/```json|```/gi, '').trim());
        } catch (e) {
          // If Gemini sent pure Markdown instead of JSON, wrap it safely
          parsedReport = { additional_tips: rawReportData.replace(/\n/g, '<br>') };
        }
      }

      // Unwrap if nested inside another object
      if (parsedReport && parsedReport.report && typeof parsedReport.report === 'object') {
        parsedReport = parsedReport.report;
      } else if (parsedReport && parsedReport.data && typeof parsedReport.data === 'object') {
        parsedReport = parsedReport.data;
      }
      // ---------------------------------

      this.state.report = parsedReport;
      this.state.analysis = analysisData;
      this.state.answers = answersData;

      console.log('[Report] Parsed report data:', this.state.report);

      this.state.isLoading = false;
      this.displayReport();
      this.showReportContent();
    } catch (error) {
      console.error('[Report] Failed to load report:', error);
      this.state.hasError = true;
      this.showError(error.message || 'Failed to load report');
    }
  },

/**
   * Display report content
   */
  displayReport() {
    const report = this.state.report;

    // Create report HTML
    let html = '<div class="report-header">';
    html += '<h1 class="report-title">Your Skincare Analysis Report</h1>';
    html += '<p class="report-subtitle">Personalized recommendations based on your skin analysis</p>';
    html += '<div class="report-meta">';
    html += `<span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}</span>`;
    html += '</div></div>';

    // Helper to safely get arrays from possible camelCase or snake_case formatting from Gemini
    const getArray = (key1, key2) => Array.isArray(report[key1]) ? report[key1] : (Array.isArray(report[key2]) ? report[key2] : null);

    const morning = getArray('morning_routine', 'morningRoutine');
    const evening = getArray('evening_routine', 'eveningRoutine');
    const weekly = getArray('weekly_treatments', 'weeklyTreatments');
    const lifestyle = getArray('lifestyle_tips', 'lifestyleTips');

    // Morning Routine Section
    if (morning && morning.length > 0) {
      html += this.createSection('Morning Routine', 'fas fa-sun', morning);
    }

    // Evening Routine Section
    if (evening && evening.length > 0) {
      html += this.createSection('Evening Routine', 'fas fa-moon', evening);
    }

    // Weekly Treatments Section
    if (weekly && weekly.length > 0) {
      html += this.createSection('Weekly Treatments', 'fas fa-spa', weekly);
    }

    // Lifestyle Tips Section
    if (lifestyle && lifestyle.length > 0) {
      html += this.createSection('Lifestyle Tips', 'fas fa-heart', lifestyle);
    }

    // Expected Results Section
    const results = report.expected_results || report.expectedResults;
    if (results) {
      html += '<div class="report-section-block">';
      html += '<h2 class="report-section-title"><i class="fas fa-chart-line"></i> Expected Results</h2>';
      html += `<p style="line-height: 1.6; color: var(--color-text-secondary);">${results}</p>`;
      html += '</div>';
    }

    // Additional Tips Section (Also acts as fallback for pure text)
    const tips = report.additional_tips || report.additionalTips;
    if (tips) {
      html += '<div class="report-section-block">';
      html += '<h2 class="report-section-title"><i class="fas fa-lightbulb"></i> Additional Notes</h2>';
      html += `<p style="line-height: 1.6; color: var(--color-text-secondary);">${tips}</p>`;
      html += '</div>';
    }

    // Ultimate Fallback: If AI returned a completely different structure, render it as raw text so it is never blank
    if (!morning && !evening && !weekly && !lifestyle && !results && !tips) {
      html += '<div class="report-section-block">';
      html += '<h2 class="report-section-title"><i class="fas fa-clipboard"></i> AI Output</h2>';
      html += `<pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${typeof report === 'object' ? JSON.stringify(report, null, 2) : report}</pre>`;
      html += '</div>';
    }

    this.elements.content.innerHTML = html;
  },

  /**
   * Create a report section with list items
   */
  createSection(title, icon, items) {
    let html = '<div class="report-section-block">';
    html += `<h2 class="report-section-title"><i class="${icon}"></i> ${title}</h2>`;
    html += '<div class="report-list">';

    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (typeof item === 'string') {
          html += `<div class="report-list-item"><p style="margin: 0;">${item}</p></div>`;
        } else if (typeof item === 'object' && item.title && item.description) {
          html += '<div class="report-list-item">';
          html += `<div class="report-list-item-title">${item.title}</div>`;
          html += `<div class="report-list-item-text">${item.description}</div>`;
          html += '</div>';
        }
      });
    }

    html += '</div></div>';
    return html;
  },

  /**
   * Show report content and hide loading
   */
  showReportContent() {
    this.elements.loading.style.display = 'none';
    this.elements.error.style.display = 'none';
    this.elements.content.style.display = 'block';
    this.elements.actions.style.display = 'flex';
  },

  /**
   * Show error state
   */
  showError(message) {
    this.elements.loading.style.display = 'none';
    this.elements.content.style.display = 'none';
    this.elements.error.classList.add('show');
    this.elements.error.style.display = 'block';
    this.elements.actions.style.display = 'none';
    this.elements.errorMessage.textContent = message;
  },

  /**
   * Handle print action
   */
  handlePrint() {
    console.log('[Report] Printing report');
    window.print();
  },

  /**
   * Handle download PDF (simplified - uses browser print to PDF)
   */
  handleDownload() {
    console.log('[Report] Downloading report as PDF');
    // In production, this would call a PDF generation API
    // For now, we'll use browser's print-to-PDF functionality
    const originalTitle = document.title;
    document.title = 'DermAI_Pro_Report.pdf';
    
    // Prepare print
    const style = document.createElement('style');
    style.innerHTML = '@media print { body { margin: 0; } }';
    document.head.appendChild(style);

    window.print();

    // Restore
    document.title = originalTitle;
    document.head.removeChild(style);
  },

  /**
   * Handle new analysis button
   */
  handleNewAnalysis() {
    console.log('[Report] Starting new analysis');
    RouterGuard.resetFlow();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.elements.printButton) {
      this.elements.printButton.addEventListener('click', () => this.handlePrint());
    }

    if (this.elements.downloadButton) {
      this.elements.downloadButton.addEventListener('click', () => this.handleDownload());
    }

    if (this.elements.newAnalysisButton) {
      this.elements.newAnalysisButton.addEventListener('click', () => this.handleNewAnalysis());
    }

    if (this.elements.retryButton) {
      this.elements.retryButton.addEventListener('click', () => {
        location.reload();
      });
    }

    if (this.elements.chatToggle) {
      this.elements.chatToggle.addEventListener('click', () => {
        console.log('[Chat] Chat button clicked - Phase 5 feature');
        alert('Chat feature coming soon in Phase 5!');
      });
    }
  },
};

// Initialize on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  ReportPage.init();
});
