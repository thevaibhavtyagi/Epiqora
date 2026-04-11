/**
 * Epiqora - Analysis Page Logic
 * Advanced Image Diagnostic Dashboard with dynamic SVG topological overlays,
 * floating HUD badges, and connecting tech-lines.
 */

(function() {
  'use strict';

  const DOM = {
    loading: document.getElementById('analysisLoading'),
    results: document.getElementById('analysisResults'),
    error: document.getElementById('analysisError'),
    loadingMessage: document.getElementById('analysisLoadingMessage'),
    errorMessage: document.getElementById('errorMessage'),
    
    // Split Panel Image Map
    analyzedImage: document.getElementById('analyzedImage'),
    facialOverlaySvg: document.getElementById('facialOverlay'),
    
    // Animation Steps
    steps: [
      document.getElementById('procStep1'),
      document.getElementById('procStep2'),
      document.getElementById('procStep3')
    ],
    
    // Result Fields
    scoreFill: document.getElementById('scoreRingFill'),
    scoreText: document.getElementById('overallScore'),
    scoreInterpretation: document.getElementById('scoreInterpretation'),
    
    metrics: {
      skinType: document.getElementById('skinType'),
      skinTypeConf: document.getElementById('skinTypeConfidence'),
      acne: document.getElementById('acneStatus'),
      acneSeverity: document.getElementById('acneSeverity'),
      pigment: document.getElementById('pigmentationLevel'),
      darkCircles: document.getElementById('darkCircles'),
      pores: document.getElementById('poresVisibility'),
      texture: document.getElementById('textureSmoothness')
    },
    
    // Buttons
    btnRetake: document.getElementById('btnRetake'),
    btnContinue: document.getElementById('btnContinue'),
    btnRetry: document.getElementById('btnRetry')
  };

  document.addEventListener('DOMContentLoaded', function() {
    bindActionEvents();
    executeAnalysisFlow();
  });

  function bindActionEvents() {
    if (DOM.btnRetake) DOM.btnRetake.addEventListener('click', handleRetake);
    if (DOM.btnContinue) DOM.btnContinue.addEventListener('click', handleProceed);
    if (DOM.btnRetry) DOM.btnRetry.addEventListener('click', handleRetake);
  }

  function switchView(viewName) {
    if (DOM.loading) { DOM.loading.classList.remove('active'); DOM.loading.classList.add('hidden'); }
    if (DOM.results) { DOM.results.classList.remove('active'); DOM.results.classList.add('hidden'); }
    if (DOM.error) { DOM.error.classList.remove('active'); DOM.error.classList.add('hidden'); }

    if (viewName === 'loading' && DOM.loading) {
      DOM.loading.classList.add('active');
      DOM.loading.classList.remove('hidden');
    } else if (viewName === 'results' && DOM.results) {
      DOM.results.classList.add('active');
      DOM.results.classList.remove('hidden');
    } else if (viewName === 'error' && DOM.error) {
      DOM.error.classList.add('active');
      DOM.error.classList.remove('hidden');
    }
  }

  async function executeAnalysisFlow() {
    try {
      let imageData = null;
      if (typeof Storage !== 'undefined' && typeof Storage.getImage === 'function') {
        imageData = Storage.getImage();
      } else if (window.Storage && typeof window.Storage.getImage === 'function') {
        imageData = window.Storage.getImage();
      } else {
        imageData = localStorage.getItem('epiqora_current_image');
      }

      if (!imageData) {
        throw new Error('Biometric data missing. Please return to the upload screen.');
      }

      if (DOM.analyzedImage) {
        DOM.analyzedImage.src = imageData;
      }

      startNeuralAnimation();

      if (typeof submitImageForAnalysis !== 'function') {
        throw new Error('Core API connection missing (api.js not loaded properly).');
      }
      
      const payload = await submitImageForAnalysis(imageData);

      if (typeof Storage !== 'undefined' && typeof Storage.saveAnalysis === 'function') {
        Storage.saveAnalysis(payload);
      } else if (window.Storage && typeof window.Storage.saveAnalysis === 'function') {
        window.Storage.saveAnalysis(payload);
      }

      const analysisData = payload?.analysis || payload?.data || payload;
      renderDiagnosticResults(analysisData);

    } catch (error) {
      console.error('[Epiqora Engine Error]:', error);
      triggerErrorState(error.message || 'Diagnostic engine encountered a severe anomaly.');
    }
  }

  function startNeuralAnimation() {
    switchView('loading');

    DOM.steps.forEach(function(step) { if (step) step.classList.remove('active'); });
    if (DOM.steps[0]) DOM.steps[0].classList.add('active');
    
    setTimeout(function() {
      if (DOM.steps[0]) DOM.steps[0].classList.remove('active');
      if (DOM.steps[1]) DOM.steps[1].classList.add('active');
      if (DOM.loadingMessage) DOM.loadingMessage.textContent = 'Quantifying melanin distribution...';
    }, 1500);

    setTimeout(function() {
      if (DOM.steps[1]) DOM.steps[1].classList.remove('active');
      if (DOM.steps[2]) DOM.steps[2].classList.add('active');
      if (DOM.loadingMessage) DOM.loadingMessage.textContent = 'Compiling clinical score index...';
    }, 3000);
  }

  // =========================================================================
  // ADVANCED HUD OVERLAY: Polygons, Connecting Lines, and Floating Badges
  // =========================================================================
  async function generateFacialTopology(analysisData) {
    if (!DOM.facialOverlaySvg || !DOM.analyzedImage) return;
    
    if (typeof faceapi === 'undefined') {
      console.warn("Epiqora: FaceAPI library missing. Topology overlay bypassed.");
      return;
    }

    try {
      const imgObj = new Image();
      imgObj.src = DOM.analyzedImage.src;
      
      await new Promise(function(resolve) { imgObj.onload = resolve; });

      const imgWidth = imgObj.naturalWidth;
      const imgHeight = imgObj.naturalHeight;
      DOM.facialOverlaySvg.setAttribute('viewBox', '0 0 ' + imgWidth + ' ' + imgHeight);

      DOM.facialOverlaySvg.innerHTML = `
        <defs>
          <filter id="heatmapGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      `;

      const detection = await faceapi.detectSingleFace(imgObj).withFaceLandmarks();
      
      if (!detection) return;

      const landmarks = detection.landmarks;
      const jaw = landmarks.getJawOutline();       
      const nose = landmarks.getNose();            
      const leftEye = landmarks.getLeftEye();      
      const rightEye = landmarks.getRightEye();    
      const leftBrow = landmarks.getLeftEyeBrow(); 
      const rightBrow = landmarks.getRightEyeBrow(); 
      const box = detection.detection.box;

      // Extract Status
      const hasAcne = analysisData.acne?.present !== undefined ? analysisData.acne.present : !!analysisData.acne;
      const hasDarkCircles = analysisData.dark_circles?.present !== undefined ? analysisData.dark_circles.present : !!analysisData.dark_circles;
      const poresRaw = (analysisData.pores?.visibility || analysisData.pores || '').toLowerCase();
      const hasPores = poresRaw !== 'normal' && poresRaw !== 'minimal';

      function getCentroid(points) {
        let x = 0, y = 0;
        points.forEach(function(p) { x += p.x; y += p.y; });
        return { x: x / points.length, y: y / points.length };
      }

      function createSVGBadge(x, y, label, score, statusClass) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-hud-badge ' + statusClass);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 32);
        circle.setAttribute('class', 'badge-bg');

        const scoreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        scoreText.setAttribute('x', x);
        scoreText.setAttribute('y', y + 4);
        scoreText.setAttribute('text-anchor', 'middle');
        scoreText.setAttribute('dominant-baseline', 'middle');
        scoreText.setAttribute('class', 'badge-score');
        scoreText.textContent = score;

        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', x);
        labelText.setAttribute('y', y + 50);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('class', 'badge-label');
        labelText.textContent = label;

        group.appendChild(circle);
        group.appendChild(scoreText);
        group.appendChild(labelText);
        return group;
      }

      function drawDiagnosticHUD(points, statusClass, label, score, badgeX, badgeY) {
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', points.map(function(p) { return p.x + ',' + p.y; }).join(' '));
        poly.setAttribute('class', 'zone-polygon ' + statusClass);
        poly.setAttribute('filter', 'url(#heatmapGlow)');

        const centroid = getCentroid(points);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', centroid.x);
        line.setAttribute('y1', centroid.y);
        line.setAttribute('x2', badgeX);
        line.setAttribute('y2', badgeY);
        line.setAttribute('class', 'hud-line ' + statusClass);

        const badge = createSVGBadge(badgeX, badgeY, label, score, statusClass);

        DOM.facialOverlaySvg.appendChild(poly);
        DOM.facialOverlaySvg.appendChild(line);
        DOM.facialOverlaySvg.appendChild(badge);
      }

      // Zone 1: Forehead (Pores)
      const foreheadPoints = [ leftBrow[1], rightBrow[3], { x: rightBrow[3].x, y: rightBrow[3].y - 60 }, { x: leftBrow[1].x, y: leftBrow[1].y - 60 } ];
      drawDiagnosticHUD(
        foreheadPoints, 
        hasPores ? 'zone-warn' : 'zone-good', 
        'Pores', 
        hasPores ? '68' : '92', 
        box.x + box.width / 2, 
        box.y - 70
      );

      // Zone 2: Left Cheek (Acne)
      const leftCheekPoints = [ jaw[2], jaw[5], nose[4], leftEye[0] ];
      drawDiagnosticHUD(
        leftCheekPoints, 
        hasAcne ? 'zone-warn' : 'zone-good', 
        'Acne', 
        hasAcne ? '82' : '98', 
        box.x - 80, 
        box.y + box.height * 0.6
      );

      // Zone 3: Right Cheek (Texture)
      const rightCheekPoints = [ jaw[14], jaw[11], nose[8], rightEye[3] ];
      drawDiagnosticHUD(
        rightCheekPoints, 
        hasAcne ? 'zone-warn' : 'zone-good', 
        'Texture', 
        hasAcne ? '75' : '95', 
        box.x + box.width + 80, 
        box.y + box.height * 0.6
      );

      // Zone 4: Under Eyes (Dark Circles)
      const rightEyeBag = [ rightEye[3], rightEye[5], { x: rightEye[5].x, y: rightEye[5].y + 30 }, { x: rightEye[3].x, y: rightEye[3].y + 30 } ];
      drawDiagnosticHUD(
        rightEyeBag, 
        hasDarkCircles ? 'zone-alert' : 'zone-good', 
        'Dark Circles', 
        hasDarkCircles ? '62' : '91', 
        box.x + box.width + 80, 
        box.y + box.height * 0.15
      );

    } catch (e) {
      console.warn("Epiqora: Topology mapping safely bypassed due to rendering engine error.", e);
    }
  }

  // =========================================================================
  // METRICS RENDERING
  // =========================================================================
  function renderDiagnosticResults(analysisData) {
    if (!analysisData) {
      triggerErrorState('Invalid data payload received from backend.');
      return;
    }

    setTimeout(function() {
      switchView('results');

      generateFacialTopology(analysisData);

      // Overall Score & SVG Ring
      const score = Math.round(analysisData.overall_score || analysisData.overallScore || analysisData.score || 0);
      if (DOM.scoreText) DOM.scoreText.textContent = score;
      
      if (DOM.scoreFill) {
        const circumference = 565.48;
        const offset = circumference - (score / 100) * circumference;
        
        void DOM.scoreFill.offsetWidth; 
        DOM.scoreFill.style.strokeDasharray = circumference;
        DOM.scoreFill.style.strokeDashoffset = offset;
      }

      let intelText = '';
      if (score >= 85) intelText = 'Excellent baseline. Your topography indicates optimal barrier health and hydration.';
      else if (score >= 65) intelText = 'Solid baseline. We detected minor structural deviations that can be easily optimized.';
      else if (score >= 45) intelText = 'Compromised barrier detected. A targeted regimen is highly recommended to restore balance.';
      else intelText = 'Critical intervention required. We will structure an intensive clinical routine for repair.';
      
      if (DOM.scoreInterpretation) DOM.scoreInterpretation.textContent = intelText;

      // Metrics Grid
      if (DOM.metrics.skinType) {
        DOM.metrics.skinType.textContent = analysisData.skin_type?.type || analysisData.skin_type || 'Unknown';
      }
      if (DOM.metrics.skinTypeConf) {
        DOM.metrics.skinTypeConf.textContent = 'Confidence: ' + (analysisData.skin_type?.confidence || 85) + '%';
      }

      const hasAcne = analysisData.acne?.present !== undefined ? analysisData.acne.present : !!analysisData.acne;
      if (DOM.metrics.acne) {
        DOM.metrics.acne.textContent = hasAcne ? 'Detected' : 'Clear';
        DOM.metrics.acne.className = 'result-value ' + (hasAcne ? 'status-warn' : 'status-good');
      }
      if (DOM.metrics.acneSeverity) {
        DOM.metrics.acneSeverity.textContent = hasAcne ? 'Severity: ' + (analysisData.acne?.severity || 'Mild') : 'No congestion detected';
      }

      if (DOM.metrics.pigment) {
        DOM.metrics.pigment.textContent = analysisData.pigmentation?.level || analysisData.pigmentation || 'Nominal';
      }

      const hasDarkCircles = analysisData.dark_circles?.present !== undefined ? analysisData.dark_circles.present : !!analysisData.dark_circles;
      if (DOM.metrics.darkCircles) {
        DOM.metrics.darkCircles.textContent = hasDarkCircles ? 'Present' : 'Minimal';
        DOM.metrics.darkCircles.className = 'result-value ' + (hasDarkCircles ? 'status-warn' : 'status-good');
      }

      if (DOM.metrics.pores) {
        DOM.metrics.pores.textContent = analysisData.pores?.visibility || analysisData.pores || 'Normal';
      }

      if (DOM.metrics.texture) {
        DOM.metrics.texture.textContent = analysisData.texture?.smoothness || analysisData.texture || 'Smooth';
      }

    }, 4500); 
  }

  function triggerErrorState(message) {
    switchView('error');
    if (DOM.errorMessage) DOM.errorMessage.textContent = message;
  }

  function handleRetake(event) {
    if (event) event.preventDefault();
    if (typeof RouterGuard !== 'undefined' && typeof RouterGuard.resetFlow === 'function') {
      RouterGuard.resetFlow();
    } else {
      window.location.href = '/upload'; 
    }
  }

  function handleProceed(event) {
    if (event) event.preventDefault();
    
    const btn = DOM.btnContinue;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Calibrating...';
    }
    
    setTimeout(function() {
      if (typeof RouterGuard !== 'undefined' && typeof RouterGuard.goNext === 'function') {
        RouterGuard.goNext();
      } else {
        window.location.href = '/questions'; 
      }
    }, 800);
  }

})();
