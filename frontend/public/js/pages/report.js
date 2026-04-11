/**
 * Epiqora - Report Page Logic
 * Safely parses the strict A4 JSON schema, maps it into the vanilla CSS grid,
 * and handles HTML2Canvas High-Res PNG exporting.
 */

(function() {
  'use strict';

  const DOM = {
    loading: document.getElementById('reportLoading'),
    content: document.getElementById('reportContent'),
    error: document.getElementById('reportError'),
    printableReport: document.getElementById('printableReport'),
    reportBody: document.getElementById('dynamicReportBody'),
    reportDate: document.getElementById('reportDate'),
    patientPhoto: document.getElementById('patientPhoto'),
    patientIcon: document.getElementById('patientIcon'),
    patientScore: document.getElementById('patientScore'),
    patientType: document.getElementById('patientType'),
    btnNewAnalysis: document.getElementById('newAnalysisButton'),
    btnDownloadPng: document.getElementById('downloadPngButton'),
    btnRetry: document.getElementById('retryButton'),
    errorMessage: document.getElementById('errorMessage'),
    chatTriggerBtn: document.getElementById('chatTriggerBtn'),
    chatSidebar: document.getElementById('chatSidebar'),
    closeChatBtn: document.getElementById('closeChatBtn'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    chatInput: document.getElementById('chatInput'),
    chatMessages: document.getElementById('chatMessages')
  };

  document.addEventListener('DOMContentLoaded', function() {
    bindEvents();
    executeReportFlow();
  });

  function bindEvents() {
    if (DOM.btnNewAnalysis) DOM.btnNewAnalysis.addEventListener('click', handleNewAnalysis);
    if (DOM.btnDownloadPng) DOM.btnDownloadPng.addEventListener('click', handlePngDownload);
    if (DOM.btnRetry) DOM.btnRetry.addEventListener('click', function() { location.reload(); });

    if (DOM.chatTriggerBtn && DOM.chatSidebar) {
      DOM.chatTriggerBtn.addEventListener('click', function() { DOM.chatSidebar.classList.add('open'); });
    }
    if (DOM.closeChatBtn && DOM.chatSidebar) {
      DOM.closeChatBtn.addEventListener('click', function() { DOM.chatSidebar.classList.remove('open'); });
    }
    if (DOM.sendChatBtn) DOM.sendChatBtn.addEventListener('click', handleChatSend);
    if (DOM.chatInput) {
      DOM.chatInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') handleChatSend(); });
    }
  }

  function handleChatSend() {
    const text = DOM.chatInput.value.trim();
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'message user-message';
    userMsg.textContent = text;
    DOM.chatMessages.appendChild(userMsg);
    DOM.chatInput.value = '';
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;

    setTimeout(function() {
      const aiMsg = document.createElement('div');
      aiMsg.className = 'message ai-message';
      aiMsg.innerHTML = 'Analyzing your specific protocol... Based on your skin index, I highly recommend adhering strictly to the morning regimen for optimal barrier repair.';
      DOM.chatMessages.appendChild(aiMsg);
      DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    }, 1000);
  }

  function switchView(viewName) {
    [DOM.loading, DOM.content, DOM.error].forEach(function(el) {
      if (el) {
        el.classList.remove('active');
        el.classList.add('hidden');
      }
    });

    if (viewName === 'loading' && DOM.loading) {
      DOM.loading.classList.add('active');
      DOM.loading.classList.remove('hidden');
    } else if (viewName === 'content' && DOM.content) {
      DOM.content.classList.add('active');
      DOM.content.classList.remove('hidden');
    } else if (viewName === 'error' && DOM.error) {
      DOM.error.classList.add('active');
      DOM.error.classList.remove('hidden');
    }
  }

  async function executeReportFlow() {
    try {
      console.log('[Epiqora] Initiating optimized report engine...');
      switchView('loading');

      if (typeof Storage === 'undefined') {
        throw new Error("System storage architecture missing.");
      }

      const analysisData = Storage.getAnalysis();
      const answersData = Storage.getAnswers() || {};
      const imageData = Storage.getImage();

      if (!analysisData) {
        throw new Error("Biometric data missing. Please restart sequence.");
      }

      if (DOM.reportDate) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        DOM.reportDate.textContent = 'Date: ' + new Date().toLocaleDateString('en-US', options);
      }
      
      if (DOM.patientPhoto && imageData && imageData.length > 50) {
        DOM.patientPhoto.onload = function() {
          DOM.patientPhoto.style.display = 'block';
          if (DOM.patientIcon) DOM.patientIcon.style.display = 'none';
        };
        DOM.patientPhoto.src = imageData;
      }
      
      const ad = analysisData.analysis || analysisData.data || analysisData;
      
      if (DOM.patientScore) {
        DOM.patientScore.textContent = Math.round(ad.overall_score || ad.overallScore || 0);
      }
      
      const baseSkinType = ad.skin_type?.type || ad.skin_type || 'Combination';
      if (DOM.patientType) {
        DOM.patientType.textContent = typeof baseSkinType === 'string' ? baseSkinType : 'Combination';
      }

      let rawReport = Storage.getReport();
      let isReportValid = false;

      // Check if cache is a valid object
      if (typeof rawReport === 'string') {
        try { rawReport = JSON.parse(rawReport); } catch(e) {}
      }

      if (rawReport && (rawReport.root_cause_analysis || rawReport.data?.report?.root_cause_analysis || rawReport.report?.root_cause_analysis)) {
         isReportValid = true;
      }

      // If no valid cache, fetch new
      if (!isReportValid) {
        console.log('[Epiqora] Cache empty or invalid. Triggering fresh AI generation...');
        if (typeof generateReport !== 'function') throw new Error('API Core missing.');

        const answersArray = Object.keys(answersData).map(function(key) {
          return { questionId: key, answer: answersData[key] };
        });

        const apiResponse = await generateReport(ad, [], answersArray);
        
        // Safely extract the core report BEFORE saving to avoid nesting issues
        let extractedReport = apiResponse;
        if (extractedReport?.data?.report) extractedReport = extractedReport.data.report;
        else if (extractedReport?.report) extractedReport = extractedReport.report;
        else if (extractedReport?.data) extractedReport = extractedReport.data;

        Storage.saveReport(extractedReport);
        rawReport = extractedReport; // Set it so it renders immediately
      }

      // Final unwrap just to be absolutely sure
      let finalReportObj = rawReport;
      if (finalReportObj?.data?.report) finalReportObj = finalReportObj.data.report;
      else if (finalReportObj?.report) finalReportObj = finalReportObj.report;

      renderReportContent(finalReportObj);
      
      setTimeout(function() {
        switchView('content');
      }, 800);

    } catch (error) {
      console.error('[Epiqora Report Error]:', error);
      triggerErrorState(error.message || 'Failed to formulate clinical document.');
    }
  }

  function renderReportContent(report) {
    if (!DOM.reportBody) return;
    DOM.reportBody.innerHTML = '';

    const rootCause = report?.root_cause_analysis || "AI analysis indicates structural deviations requiring specialized protocol stabilization based on your biometrics and lifestyle inputs.";
    const morning = Array.isArray(report?.morning_protocol) ? report.morning_protocol : [];
    const evening = Array.isArray(report?.evening_protocol) ? report.evening_protocol : [];
    const avoid = Array.isArray(report?.strictly_avoid) ? report.strictly_avoid.slice(0, 2) : [];
    const targets = Array.isArray(report?.clinical_targets) ? report.clinical_targets.slice(0, 2) : [];
    const systemic = Array.isArray(report?.systemic_factors) ? report.systemic_factors : null;

    let htmlBuffer = `
      <div style="margin-bottom: 18px;">
        <h2 class="section-header">
          <i class="fas fa-microscope"></i> Clinical Assessment & Root Cause
        </h2>
        <div class="reasoning-box">
          <p class="reasoning-text">${rootCause}</p>
        </div>
      </div>
      <div class="report-split-grid">
    `;

    htmlBuffer += `
      <div class="col-left">
        <h2 class="section-header">
          <i class="fas fa-prescription-bottle-medical"></i> Core Regimen
        </h2>
    `;

    const buildRoutine = function(title, icon, iconColor, data) {
      if (!data || data.length === 0) return '';
      let html = `
        <div class="routine-block">
          <h3 class="routine-title">
            <i class="${icon}" style="color: ${iconColor};"></i> ${title}
          </h3>
          <div class="routine-items-container">
      `;
      data.forEach(function(item, index) {
        html += `
          <div class="routine-item">
            <div class="routine-number">${index + 1}</div>
            <div>
              <p class="routine-product">${item.product || item.product_type || 'Treatment Step'}</p>
              <p class="routine-actives">Active Targets: ${item.active_targets || item.recommendation || 'Clinical Standard'}</p>
            </div>
          </div>
        `;
      });
      return html + '</div></div>';
    };

    htmlBuffer += buildRoutine('Morning Protocol', 'fas fa-sun', '#F59E0B', morning);
    htmlBuffer += buildRoutine('Evening Protocol', 'fas fa-moon', '#6366F1', evening);
    htmlBuffer += '</div>';

    htmlBuffer += `
      <div class="col-right">
        <h2 class="section-header" style="margin-bottom: 16px;">
          <i class="fas fa-clipboard-list"></i> Habits & Directives
        </h2>
    `;

    const buildList = function(title, icon, iconColor, listIcon, listIconColor, data) {
      if (!data || data.length === 0) return '';
      let html = `
        <div class="habit-block">
          <h3 class="habit-title" style="color: ${iconColor};">
            <i class="${icon}"></i> ${title}
          </h3>
          <ul class="habit-list">
      `;
      data.forEach(function(item) {
        const text = typeof item === 'string' ? item : (item.tip || item.category || '');
        html += `
          <li class="habit-item">
            <i class="${listIcon}" style="color: ${listIconColor}; margin-top: 3px; font-size: 0.6rem;"></i>
            <span class="habit-text">${text}</span>
          </li>
        `;
      });
      return html + '</ul></div>';
    };

    htmlBuffer += buildList('Strictly Avoid', 'fas fa-ban', '#F43F5E', 'fas fa-times-circle', '#FB7185', avoid);
    htmlBuffer += buildList('Clinical Targets', 'fas fa-check-circle', '#059669', 'fas fa-check', '#10B981', targets);
    
    if (systemic && systemic.length > 0) {
      htmlBuffer += '<div style="margin-top: auto; padding-top: 12px; border-top: 1px solid #E2E8F0;">';
      htmlBuffer += buildList('Systemic Factors', 'fas fa-droplet', '#6366F1', 'fas fa-circle', '#818CF8', systemic);
      htmlBuffer += '</div>';
    }

    htmlBuffer += `
        <div class="habit-disclaimer">
          Skin cycles take ~28 days. Stick strictly to this protocol for at least 4 weeks to see structural changes.
        </div>
      </div>
    </div>`;

    DOM.reportBody.innerHTML = htmlBuffer;
  }

  function triggerErrorState(message) {
    switchView('error');
    if (DOM.errorMessage) {
      DOM.errorMessage.textContent = message;
    }
  }

  function handleNewAnalysis(event) {
    if (event) event.preventDefault();
    if (typeof RouterGuard !== 'undefined' && typeof RouterGuard.resetFlow === 'function') {
      RouterGuard.resetFlow();
    } else {
      window.location.href = '/upload';
    }
  }

  async function handlePngDownload(event) {
    if (event) event.preventDefault();
    
    if (!DOM.printableReport || typeof html2canvas === 'undefined') {
      console.error('[Epiqora] html2canvas or printable report not available');
      return;
    }

    const btn = DOM.btnDownloadPng;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Rendering PNG...';

    // MAGIC TRICK: Force the body into A4 desktop layout for the screenshot
    document.body.classList.add('exporting-mode');
    
    // Give the browser 100ms to apply the CSS changes
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(DOM.printableReport, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        windowWidth: 1000 // Fake a desktop window width
      });

      const imgData = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = imgData;
      downloadLink.download = 'Epiqora_Clinical_Protocol.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch (error) {
      console.error("[Epiqora] Export Failed:", error);
      alert("Failed to render PNG. Please check browser permissions.");
    } finally {
      // Revert back to mobile view immediately
      document.body.classList.remove('exporting-mode');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

})();