/**
 * DermAI Pro - Session Storage Management
 * Handles all application state persistence using sessionStorage
 */

const Storage = {
  // Keys
  KEYS: {
    IMAGE: 'dermai_image',
    ANALYSIS: 'dermai_analysis',
    ANSWERS: 'dermai_answers',
    REPORT: 'dermai_report',
  },

  /**
   * Save image data
   */
  saveImage(imageData) {
    sessionStorage.setItem(this.KEYS.IMAGE, imageData);
    console.log('[Storage] Image saved');
  },

  /**
   * Get saved image
   */
  getImage() {
    return sessionStorage.getItem(this.KEYS.IMAGE);
  },

  /**
   * Save analysis results
   */
  saveAnalysis(analysisData) {
    sessionStorage.setItem(this.KEYS.ANALYSIS, JSON.stringify(analysisData));
    console.log('[Storage] Analysis saved');
  },

  /**
   * Get saved analysis
   */
  getAnalysis() {
    const data = sessionStorage.getItem(this.KEYS.ANALYSIS);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Save question answers
   */
  saveAnswers(answersData) {
    sessionStorage.setItem(this.KEYS.ANSWERS, JSON.stringify(answersData));
    console.log('[Storage] Answers saved');
  },

  /**
   * Get saved answers
   */
  getAnswers() {
    const data = sessionStorage.getItem(this.KEYS.ANSWERS);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Save report data
   */
  saveReport(reportData) {
    sessionStorage.setItem(this.KEYS.REPORT, JSON.stringify(reportData));
    console.log('[Storage] Report saved');
  },

  /**
   * Get saved report
   */
  getReport() {
    const data = sessionStorage.getItem(this.KEYS.REPORT);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Clear all data
   */
  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
    console.log('[Storage] All data cleared');
  },

  /**
   * Clear specific data
   */
  clear(key) {
    sessionStorage.removeItem(key);
    console.log('[Storage] Cleared:', key);
  },

  /**
   * Check if user has completed a specific step
   */
  hasCompleted(step) {
    switch(step) {
      case 'upload':
        return this.getImage() !== null;
      case 'analysis':
        return this.getAnalysis() !== null;
      case 'questions':
        return this.getAnswers() !== null;
      case 'report':
        return this.getReport() !== null;
      default:
        return false;
    }
  },
};
