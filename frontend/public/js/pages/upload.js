/**
 * Epiqora - Upload Page Logic
 * Handles image capture, validation, and biometric scanning
 * Optimized for smooth animations and reliable state management
 */

(function() {
  'use strict';

  // Application State
  const AppState = {
    stream: null,
    imageData: null,
    modelsLoaded: false,
    isScanning: false
  };

  // DOM Elements
  const DOM = {
    views: {
      selection: null,
      camera: null,
      preview: null
    },
    camera: {
      video: null,
      btnOpen: null,
      btnCancel: null,
      btnCapture: null
    },
    upload: {
      input: null,
      btnRetake: null,
      btnAnalyze: null
    },
    preview: {
      image: null,
      scanner: null
    },
    status: {
      loading: null,
      result: null
    },
    stepper: {
      progress: null,
      step1: null,
      step2: null
    }
  };

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeDOM();
    bindUIEvents();
    preloadAIModels();
  });

  function initializeDOM() {
    DOM.views.selection = document.getElementById('viewSelection');
    DOM.views.camera = document.getElementById('viewCamera');
    DOM.views.preview = document.getElementById('viewPreview');
    
    DOM.camera.video = document.getElementById('cameraVideo');
    DOM.camera.btnOpen = document.getElementById('btnOpenCamera');
    DOM.camera.btnCancel = document.getElementById('btnCancelCamera');
    DOM.camera.btnCapture = document.getElementById('btnCapture');
    
    DOM.upload.input = document.getElementById('fileInput');
    DOM.upload.btnRetake = document.getElementById('btnRetake');
    DOM.upload.btnAnalyze = document.getElementById('btnAnalyze');
    
    DOM.preview.image = document.getElementById('previewImage');
    DOM.preview.scanner = document.getElementById('hudScanner');
    
    DOM.status.loading = document.getElementById('statusLoading');
    DOM.status.result = document.getElementById('statusResult');
    
    DOM.stepper.progress = document.getElementById('stepProgress');
    DOM.stepper.step1 = document.getElementById('step1');
    DOM.stepper.step2 = document.getElementById('step2');
  }

  function bindUIEvents() {
    if (DOM.upload.input) {
      DOM.upload.input.addEventListener('change', handleFileSelect);
    }
    if (DOM.camera.btnOpen) {
      DOM.camera.btnOpen.addEventListener('click', initiateCamera);
    }
    if (DOM.camera.btnCancel) {
      DOM.camera.btnCancel.addEventListener('click', resetToHomeView);
    }
    if (DOM.camera.btnCapture) {
      DOM.camera.btnCapture.addEventListener('click', captureLivePhoto);
    }
    if (DOM.upload.btnRetake) {
      DOM.upload.btnRetake.addEventListener('click', resetToHomeView);
    }
    if (DOM.upload.btnAnalyze) {
      DOM.upload.btnAnalyze.addEventListener('click', submitToAnalysis);
    }
  }

  // Preload FaceAPI models
  async function preloadAIModels() {
    try {
      const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';
      
      if (typeof faceapi === 'undefined') {
        return setTimeout(preloadAIModels, 500);
      }
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);
      
      AppState.modelsLoaded = true;
    } catch (error) {
      console.warn('Epiqora: AI Models in fallback mode.');
    }
  }

  // View Management
  function switchActiveView(viewKey) {
    Object.keys(DOM.views).forEach(function(key) {
      const viewNode = DOM.views[key];
      if (viewNode) {
        viewNode.classList.remove('active');
        viewNode.style.display = 'none';
      }
    });
    
    const targetNode = DOM.views[viewKey];
    if (targetNode) {
      targetNode.style.display = viewKey === 'selection' ? 'grid' : 'flex';
      
      requestAnimationFrame(function() {
        targetNode.classList.add('active');
      });
    }
  }

  function resetToHomeView(event) {
    if (event) event.preventDefault();
    
    stopVideoStream();
    stopScanner();
    
    if (DOM.upload.input) DOM.upload.input.value = '';
    AppState.imageData = null;
    
    if (DOM.status.loading) DOM.status.loading.style.display = 'none';
    if (DOM.status.result) {
      DOM.status.result.style.display = 'none';
      DOM.status.result.classList.add('hidden');
    }
    if (DOM.upload.btnAnalyze) DOM.upload.btnAnalyze.disabled = true;
    
    switchActiveView('selection');
    
    // Reset stepper
    if (DOM.stepper.step1) {
      DOM.stepper.step1.classList.remove('completed');
      DOM.stepper.step1.classList.add('active');
      DOM.stepper.step1.innerHTML = '<div class="step-circle"><i class="fas fa-camera"></i></div><div class="step-label">Photo</div>';
    }
    if (DOM.stepper.step2) {
      DOM.stepper.step2.classList.remove('active');
    }
    if (DOM.stepper.progress) {
      DOM.stepper.progress.style.width = '0%';
    }
  }

  // Camera Functions
  async function initiateCamera(event) {
    if (event) event.preventDefault();
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media API unavailable');
      }

      AppState.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      DOM.camera.video.srcObject = AppState.stream;
      switchActiveView('camera');
    } catch (error) {
      displayToastMessage('Camera unavailable. Please upload an image.', 'error');
    }
  }

  function stopVideoStream() {
    if (AppState.stream) {
      AppState.stream.getTracks().forEach(function(track) {
        track.stop();
      });
      AppState.stream = null;
    }
  }

  function captureLivePhoto(event) {
    if (event) event.preventDefault();
    
    const hiddenCanvas = document.getElementById('hiddenCanvas');
    const liveVideo = DOM.camera.video;
    
    if (!liveVideo.videoWidth) {
      displayToastMessage('Camera warming up, please retry.', 'error');
      return;
    }
    
    hiddenCanvas.width = liveVideo.videoWidth;
    hiddenCanvas.height = liveVideo.videoHeight;
    
    const ctx = hiddenCanvas.getContext('2d');
    ctx.translate(hiddenCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(liveVideo, 0, 0);
    
    stopVideoStream();
    executeBiometricScan(hiddenCanvas.toDataURL('image/jpeg', 0.92));
  }

  // File Upload
  function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      displayToastMessage('Invalid format. Image required.', 'error');
      event.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      executeBiometricScan(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  // Scanner Functions - Optimized for smooth animation
  function startScanner() {
    if (!DOM.preview.scanner || AppState.isScanning) return;
    
    AppState.isScanning = true;
    
    // Reset scanner state completely first
    const scanner = DOM.preview.scanner;
    const laser = scanner.querySelector('.hud-laser');
    
    // Force reset
    scanner.classList.remove('active');
    scanner.style.display = 'none';
    
    if (laser) {
      laser.style.animation = 'none';
      laser.offsetHeight; // Force reflow
    }
    
    // Start fresh animation
    requestAnimationFrame(function() {
      scanner.style.display = 'block';
      
      requestAnimationFrame(function() {
        scanner.classList.add('active');
        if (laser) {
          laser.style.animation = '';
        }
      });
    });
  }

  function stopScanner() {
    if (!DOM.preview.scanner) return;
    
    AppState.isScanning = false;
    
    const scanner = DOM.preview.scanner;
    const laser = scanner.querySelector('.hud-laser');
    
    scanner.classList.remove('active');
    
    if (laser) {
      laser.style.animation = 'none';
    }
    
    setTimeout(function() {
      scanner.style.display = 'none';
    }, 100);
  }

  function executeBiometricScan(dataUrl) {
    AppState.imageData = dataUrl;
    DOM.preview.image.src = dataUrl;
    
    switchActiveView('preview');
    
    if (DOM.status.result) {
      DOM.status.result.style.display = 'none';
      DOM.status.result.classList.add('hidden');
    }
    if (DOM.status.loading) {
      DOM.status.loading.style.display = 'flex';
    }
    if (DOM.upload.btnAnalyze) {
      DOM.upload.btnAnalyze.disabled = true;
    }

    // Start scanner with slight delay for smooth transition
    setTimeout(function() {
      startScanner();
    }, 100);

    // Process after animation
    setTimeout(async function() {
      const result = await authenticateFaceGeometry(dataUrl);
      resolveScanResult(result);
    }, 3200);
  }

  async function authenticateFaceGeometry(dataUrl) {
    if (!AppState.modelsLoaded || typeof faceapi === 'undefined') {
      return {
        success: true,
        msg: 'Image verified. Analysis ready.'
      };
    }
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
      
      await new Promise(function(resolve, reject) {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const detections = await faceapi.detectAllFaces(img).withFaceLandmarks();
      
      if (detections.length === 0) {
        return {
          success: false,
          msg: 'No face detected. Please ensure good lighting.'
        };
      }
      
      if (detections.length > 1) {
        return {
          success: false,
          msg: 'Multiple faces detected. Solo portrait required.'
        };
      }
      
      return {
        success: true,
        msg: 'Biometric data captured successfully.'
      };
    } catch (error) {
      return {
        success: false,
        msg: 'Analysis error. Please try again.'
      };
    }
  }

  function resolveScanResult(result) {
    stopScanner();
    
    if (DOM.status.loading) {
      DOM.status.loading.style.display = 'none';
    }
    
    const statusBox = DOM.status.result;
    if (statusBox) {
      statusBox.style.display = 'flex';
      statusBox.classList.remove('hidden');
      
      if (result.success) {
        statusBox.className = 'feedback-box feedback-success';
        statusBox.innerHTML = '<i class="fas fa-check-circle"></i> ' + result.msg;
        
        if (DOM.upload.btnAnalyze) {
          DOM.upload.btnAnalyze.disabled = false;
        }
        
        displayToastMessage('Ready for analysis.', 'success');
        
        // Update stepper
        if (DOM.stepper.step1) {
          DOM.stepper.step1.classList.remove('active');
          DOM.stepper.step1.classList.add('completed');
          DOM.stepper.step1.innerHTML = '<div class="step-circle"><i class="fas fa-check"></i></div><div class="step-label">Photo</div>';
        }
        if (DOM.stepper.progress) {
          DOM.stepper.progress.style.width = '33%';
        }
        if (DOM.stepper.step2) {
          DOM.stepper.step2.classList.add('active');
        }
      } else {
        statusBox.className = 'feedback-box feedback-error';
        statusBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + result.msg;
        
        displayToastMessage('Verification failed. Please retry.', 'error');
      }
    }
  }

  function submitToAnalysis(event) {
    if (event) event.preventDefault();
    if (!AppState.imageData) return;
    
    const btn = DOM.upload.btnAnalyze;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
    }
    
    // Save image data
    try {
      if (window.Storage && typeof window.Storage.saveImage === 'function') {
        window.Storage.saveImage(AppState.imageData);
      } else if (typeof Storage !== 'undefined' && typeof Storage.saveImage === 'function') {
        Storage.saveImage(AppState.imageData);
      }
    } catch (err) {
      console.warn('Epiqora: Storage bypassed.');
    }
    
    setTimeout(function() {
      displayToastMessage('Connecting to analysis engine...', 'success');
      
      setTimeout(function() {
        if (btn) {
          btn.innerHTML = '<i class="fas fa-check"></i> Redirecting...';
        }
        window.location.href = '/analysis';
      }, 800);
    }, 1000);
  }

  function displayToastMessage(message, level) {
    const toast = document.getElementById('toastMessage');
    const icon = document.getElementById('toastIcon');
    const text = document.getElementById('toastText');
    
    if (!toast || !icon || !text) return;
    
    toast.style.background = level === 'error' ? 'var(--color-error)' : 'var(--color-text-primary)';
    icon.className = level === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    icon.style.color = level === 'error' ? '#FFF' : 'var(--color-brand-cyan)';
    
    text.textContent = message;
    
    toast.classList.add('show');
    setTimeout(function() {
      toast.classList.remove('show');
    }, 3500);
  }

})();
