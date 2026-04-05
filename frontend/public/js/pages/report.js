/**
 * Dermora Pro - Report Page Logic
 * Parses complex AI clinical data (Product Types, Reasons, Frequencies),
 * injects patient biometrics into a strict A4 template, and exports to PNG.
 */

(function() {
  'use strict';

  const DOM = {
    loading: document.getElementById('reportLoading'),
    content: document.getElementById('reportContent'),
    error: document.getElementById('reportError'),
    
    // Printable A4 Area
    printableReport: document.getElementById('printableReport'),
    reportBody: document.getElementById('dynamicReportBody'),
    
    // Patient Profile Injectors
    reportDate: document.getElementById('reportDate'),
    patientPhoto: document.getElementById('patientPhoto'),
    patientScore: document.getElementById('patientScore'),
    patientType: document.getElementById('patientType'),
    
    // Buttons
    btnNewAnalysis: document.getElementById('newAnalysisButton'),
    btnDownloadPng: document.getElementById('downloadPngButton'),
    btnRetry: document.getElementById('retryButton'),
    errorMessage: document.getElementById('errorMessage'),

    // Chat Sidebar
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

    // Chat Sidebar Logic
    if (DOM.chatTriggerBtn && DOM.chatSidebar) {
      DOM.chatTriggerBtn.addEventListener('click', function() {
        DOM.chatSidebar.classList.add('open');
      });
    }
    if (DOM.closeChatBtn && DOM.chatSidebar) {
      DOM.closeChatBtn.addEventListener('click', function() {
        DOM.chatSidebar.classList.remove('open');
      });
    }
    
    // Simple Chat Simulation
    if (DOM.sendChatBtn) {
      DOM.sendChatBtn.addEventListener('click', handleChatSend);
    }
    if (DOM.chatInput) {
      DOM.chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleChatSend();
      });
    }
  }

  function handleChatSend() {
    const text = DOM.chatInput.value.trim();
    if (!text) return;

    // Render User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'message user-message';
    userMsg.textContent = text;
    DOM.chatMessages.appendChild(userMsg);
    DOM.chatInput.value = '';
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;

    // Simulate AI Response
    setTimeout(function() {
      const aiMsg = document.createElement('div');
      aiMsg.className = 'message ai-message';
      aiMsg.innerHTML = 'Analyzing your specific protocol... Based on your skin index, I highly recommend adhering strictly to the morning regimen for optimal barrier repair.';
      DOM.chatMessages.appendChild(aiMsg);
      DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    }, 1000);
  }

  function switchView(viewName) {
    if (DOM.loading) { DOM.loading.classList.remove('active'); DOM.loading.classList.add('hidden'); }
    if (DOM.content) { DOM.content.classList.remove('active'); DOM.content.classList.add('hidden'); }
    if (DOM.error) { DOM.error.classList.remove('active'); DOM.error.classList.add('hidden'); }

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
      console.log('[Dermora] Initiating report generation engine...');
      switchView('loading');

      if (typeof Storage === 'undefined') throw new Error("System storage architecture missing.");

      const analysisData = Storage.getAnalysis();
      const answersData = Storage.getAnswers() || {};
      const imageData = Storage.getImage();

      if (!analysisData) throw new Error("Biometric data missing. Please restart sequence.");

      // 1. Inject Header Data
      if (DOM.reportDate) {
        DOM.reportDate.textContent = `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      }
      if (DOM.patientPhoto && imageData) {
        DOM.patientPhoto.src = imageData;
      }
      
      const ad = analysisData.analysis || analysisData.data || analysisData;
      if (DOM.patientScore) DOM.patientScore.textContent = Math.round(ad.overall_score || ad.overallScore || 0);
      if (DOM.patientType) DOM.patientType.textContent = ad.skin_type?.type || ad.skin_type || 'Combination';

      // 2. Safely Fetch or Generate the Report Payload
      let rawReport = Storage.getReport();
      
      if (!rawReport) {
        if (typeof generateReport !== 'function') {
          throw new Error('Core API missing (generateReport function not found).');
        }

        const answersArray = Object.keys(answersData).map(function(key) {
          return { questionId: key, answer: answersData[key] };
        });

        rawReport = await generateReport(ad, [], answersArray);
        Storage.saveReport(rawReport?.report || rawReport);
      }

      // 3. Bulletproof JSON Extraction (Fixes the Raw Code Dump)
      let reportObj = rawReport;
      if (typeof rawReport === 'string') {
        try {
          // Regex to strip out markdown code blocks (```json) if Gemini added them
          const jsonMatch = rawReport.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            reportObj = JSON.parse(jsonMatch[0]);
          } else {
            reportObj = JSON.parse(rawReport);
          }
        } catch (e) {
          console.warn("Failed to parse raw report string, attempting fallback.", e);
          reportObj = { additionalTips: rawReport.replace(/\n/g, '<br>') };
        }
      }

      if (reportObj && reportObj.report) reportObj = reportObj.report;
      else if (reportObj && reportObj.data) reportObj = reportObj.data;

      // 4. Render the DOM structure
      renderReportContent(reportObj);
      
      // Delay slightly so user sees the premium loader
      setTimeout(function() {
        switchView('content');
      }, 800);

    } catch (error) {
      console.error('[Dermora Report Error]:', error);
      triggerErrorState(error.message || 'Failed to formulate clinical document.');
    }
  }

  // Parses complex AI Schema into beautiful 2-Column HTML Blocks
  function renderReportContent(report) {
    if (!DOM.reportBody) return;
    DOM.reportBody.innerHTML = ''; 

    // Helper to safely get arrays regardless of camelCase or snake_case
    const getArray = (key1, key2) => Array.isArray(report[key1]) ? report[key1] : (Array.isArray(report[key2]) ? report[key2] : null);

    const morning = getArray('morning_routine', 'morningRoutine');
    const evening = getArray('evening_routine', 'eveningRoutine');
    const treatments = getArray('weekly_treatments', 'weeklyTreatments');
    const lifestyle = getArray('lifestyle_tips', 'lifestyleTips');
    
    // Hyper-Resilient Section Builder
    function buildSection(title, icon, itemsArray) {
      if (!itemsArray || itemsArray.length === 0) return '';
      
      let html = `<div class="report-section-block">
                    <h2 class="report-section-title"><i class="${icon}"></i> ${title}</h2>
                    <div class="report-list">`;
      
      itemsArray.forEach(function(item) {
        if (typeof item === 'string') {
          html += `<div class="report-list-item"><p style="margin: 0;">${item}</p></div>`;
        } else if (typeof item === 'object') {
          
          // Dynamically hunt for the title in the AI's complex schema
          let itemTitle = item.productType || item.product_type || item.title || item.category || item.treatment || 'Recommendation';
          
          // Build the description string logically based on available keys
          let itemDesc = '';
          if (item.recommendation) itemDesc += `<span class="highlight-text">${item.recommendation}</span><br>`;
          if (item.description) itemDesc += `${item.description}<br>`;
          if (item.tip) itemDesc += `${item.tip}<br>`;
          if (item.frequency) itemDesc += `<strong>Frequency:</strong> ${item.frequency}<br>`;
          
          // Add the "Reason" cleanly underneath
          if (item.reason) {
            itemDesc += `<div class="reason-text"><em>Clinical Note: ${item.reason}</em></div>`;
          }

          html += `<div class="report-list-item">
                     <div class="report-list-item-title">${itemTitle}</div>
                     <div class="report-list-item-text">${itemDesc}</div>
                   </div>`;
        }
      });
      html += `</div></div>`;
      return html;
    }

    // Assemble 2-Column Architecture
    let leftColumnHtml = '<div class="report-column">';
    leftColumnHtml += buildSection('Morning Regimen', 'fas fa-sun', morning);
    leftColumnHtml += buildSection('Evening Regimen', 'fas fa-moon', evening);
    leftColumnHtml += '</div>';

    let rightColumnHtml = '<div class="report-column">';
    rightColumnHtml += buildSection('Clinical Treatments', 'fas fa-spa', treatments);
    rightColumnHtml += buildSection('Lifestyle Protocol', 'fas fa-heartbeat', lifestyle);
    rightColumnHtml += '</div>';

    let htmlBuffer = `<div class="two-column-grid">${leftColumnHtml}${rightColumnHtml}</div>`;

    // Projected Outcomes (Safely parses objects to prevent [object Object] error)
    let results = report.expected_results || report.expectedResults;
    if (results) {
      let resultsHtml = '';
      if (typeof results === 'string') {
        resultsHtml = results;
      } else if (typeof results === 'object') {
        // If AI returns an object like { "1_week": "...", "1_month": "..." }
        resultsHtml = Object.entries(results).map(([key, val]) => {
          const cleanKey = key.replace(/_/g, ' ').toUpperCase();
          return `<strong>${cleanKey}:</strong> ${val}`;
        }).join('<br><br>');
      }

      htmlBuffer += `<div class="report-section-block">
                       <h2 class="report-section-title"><i class="fas fa-chart-line"></i> Projected Outcomes</h2>
                       <div class="report-text-block">${resultsHtml}</div>
                     </div>`;
    }

    // Additional Tips
    let tips = report.additional_tips || report.additionalTips;
    if (tips) {
      let tipsHtml = '';
      if (Array.isArray(tips)) {
        tipsHtml = tips.map(t => `• ${t}`).join('<br>');
      } else if (typeof tips === 'string') {
        tipsHtml = tips;
      }

      htmlBuffer += `<div class="report-section-block" style="margin-top: 32px;">
                       <h2 class="report-section-title"><i class="fas fa-lightbulb"></i> Clinical Notes</h2>
                       <div class="report-text-block">${tipsHtml}</div>
                     </div>`;
    }

    // Ultimate Fallback (Only fires if the JSON was completely unrecognizable)
    if (!morning && !evening && !treatments && !lifestyle && !results && !tips) {
      htmlBuffer = `<div class="report-section-block">
                       <h2 class="report-section-title"><i class="fas fa-clipboard"></i> Protocol Output</h2>
                       <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6; padding: 20px; background: #F8FAFC; border-radius: 12px;">${typeof report === 'object' ? JSON.stringify(report, null, 2) : report}</pre>
                     </div>`;
    }

    DOM.reportBody.innerHTML = htmlBuffer;
  }

  function triggerErrorState(message) {
    switchView('error');
    if (DOM.errorMessage) DOM.errorMessage.textContent = message;
  }

  // =========================================================================
  // ACTIONS: Routing & High-Res PNG Download Engine
  // =========================================================================
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
      alert("Download engine initializing. Please wait a second and try again.");
      return;
    }

    const btn = DOM.btnDownloadPng;
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Rendering High-Res PNG...';

    try {
      // html2canvas accurately captures the strict A4 CSS bounds
      const canvas = await html2canvas(DOM.printableReport, {
        scale: window.devicePixelRatio || 2, // High resolution mapping
        useCORS: true, // Securely renders the user's uploaded image
        backgroundColor: '#FFFFFF',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.href = imgData;
      downloadLink.download = 'Dermora_Clinical_Protocol.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch (error) {
      console.error("[Dermora] PNG Export Failed:", error);
      alert("Failed to render PNG. Please check your browser permissions.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

})();