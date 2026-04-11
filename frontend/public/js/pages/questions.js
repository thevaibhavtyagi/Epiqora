/**
 * Epiqora - Questions Page Script
 * Handles dynamic question loading, validation, and answer submission.
 * Routes to Report page for final processing.
 */

(function() {
  'use strict';

  const QuestionsPage = {
    state: {
      questions: [],
      answers: {},
      currentQuestionIndex: 0,
      isLoading: true,
      hasError: false,
    },

    elements: {
      loading: document.getElementById('questionsLoading'),
      form: document.getElementById('questionsForm'),
      error: document.getElementById('questionsError'),
      container: document.getElementById('questionContainer'),
      currentQuestion: document.getElementById('currentQuestion'),
      totalQuestions: document.getElementById('totalQuestions'),
      progressFill: document.getElementById('progressFill'),
      nextButton: document.getElementById('nextButton'),
      backButton: document.getElementById('backButton'),
      submitButton: document.getElementById('submitButton'),
      skipButton: document.getElementById('skipButton'),
      retryButton: document.getElementById('retryButton'),
      errorMessage: document.getElementById('errorMessage'),
    },

    async init() {
      console.log('[Epiqora] Initializing questions module');
      
      // Guard page access
      if (typeof RouterGuard !== 'undefined' && typeof RouterGuard.guardPage === 'function') {
        try { RouterGuard.guardPage(); } catch(e) {}
      }
      
      await this.loadQuestions();
      this.setupEventListeners();
    },

    switchView(viewName) {
      // Hide all views
      if (this.elements.loading) {
        this.elements.loading.classList.remove('active');
        this.elements.loading.style.display = 'none';
      }
      if (this.elements.form) {
        this.elements.form.classList.remove('active');
        this.elements.form.classList.add('hidden');
      }
      if (this.elements.error) {
        this.elements.error.classList.remove('active');
        this.elements.error.classList.add('hidden');
      }

      // Show requested view
      if (viewName === 'loading' && this.elements.loading) {
        this.elements.loading.classList.add('active');
        this.elements.loading.style.display = 'block';
      } else if (viewName === 'form' && this.elements.form) {
        this.elements.form.classList.add('active');
        this.elements.form.classList.remove('hidden');
      } else if (viewName === 'error' && this.elements.error) {
        this.elements.error.classList.add('active');
        this.elements.error.classList.remove('hidden');
      }
    },

    async loadQuestions() {
      try {
        let storedData = null;
        if (typeof Storage !== 'undefined' && typeof Storage.getAnalysis === 'function') {
          storedData = Storage.getAnalysis();
        }

        if (!storedData || !storedData.analysis) {
          throw new Error('Biometric data not found. Please upload an image first.');
        }

        if (typeof fetchQuestions !== 'function') {
          throw new Error('Core API missing (fetchQuestions function not found).');
        }

        const rawData = await fetchQuestions(storedData.analysis);
        
        let questionsArray = [];
        try {
          let parsed = typeof rawData === 'string' 
            ? JSON.parse(rawData.replace(/```json|```/gi, '').trim()) 
            : rawData;
          
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            questionsArray = parsed.questions || parsed.data || [];
          } else if (Array.isArray(parsed)) {
            questionsArray = parsed;
          }
        } catch (parseError) {
          console.error('[Epiqora] Failed to parse AI questions schema:', parseError);
        }

        this.state.questions = questionsArray;
        
        if (!this.state.questions || this.state.questions.length === 0) {
          throw new Error('Invalid format received from AI engine. Retrying recommended.');
        }
        
        // Initialize answers object
        this.state.answers = {};
        this.state.questions.forEach(q => {
          this.state.answers[q.id] = null;
        });
        
        this.state.isLoading = false;
        this.switchView('form');
        this.elements.totalQuestions.textContent = this.state.questions.length;
        this.displayCurrentQuestion();
        
      } catch (error) {
        console.error('[Epiqora] Diagnostic load failure:', error);
        this.state.hasError = true;
        this.showError(error.message || 'Failed to sync with clinical engine.');
      }
    },

    displayCurrentQuestion() {
      const question = this.state.questions[this.state.currentQuestionIndex];
      if (!question) return;

      this.elements.container.innerHTML = '';
      
      const questionBlock = document.createElement('div');
      questionBlock.className = 'question-block';

      const label = document.createElement('label');
      label.className = 'question-label';
      label.textContent = question.question;
      questionBlock.appendChild(label);

      // Render based on question type
      switch (question.type) {
        case 'single_choice':
          this.renderSingleChoice(questionBlock, question);
          break;
        case 'multiple_choice':
          this.renderMultipleChoice(questionBlock, question);
          break;
        case 'text':
          this.renderTextInput(questionBlock, question);
          break;
        case 'range':
          this.renderRangeSlider(questionBlock, question);
          break;
        default:
          this.renderSingleChoice(questionBlock, question);
      }

      this.elements.container.appendChild(questionBlock);
      this.updateProgress();
    },

    renderSingleChoice(parentEl, question) {
      const optionsGrid = document.createElement('div');
      optionsGrid.className = 'question-options-grid';

      question.options.forEach((optionText) => {
        const labelEl = document.createElement('label');
        labelEl.className = 'premium-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `question-${question.id}`;
        input.value = optionText;
        input.checked = this.state.answers[question.id] === optionText;

        const customRadio = document.createElement('div');
        customRadio.className = 'custom-radio';

        const textSpan = document.createElement('span');
        textSpan.className = 'option-text';
        textSpan.textContent = optionText;

        input.addEventListener('change', (e) => {
          this.handleAnswerChange(question.id, e.target.value);
        });

        labelEl.appendChild(input);
        labelEl.appendChild(customRadio);
        labelEl.appendChild(textSpan);
        optionsGrid.appendChild(labelEl);
      });

      parentEl.appendChild(optionsGrid);
    },

    renderMultipleChoice(parentEl, question) {
      const optionsGrid = document.createElement('div');
      optionsGrid.className = 'question-options-grid';

      question.options.forEach((optionText) => {
        const labelEl = document.createElement('label');
        labelEl.className = 'premium-option';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = `question-${question.id}`;
        input.value = optionText;

        if (Array.isArray(this.state.answers[question.id])) {
          input.checked = this.state.answers[question.id].includes(optionText);
        }

        const customCheckbox = document.createElement('div');
        customCheckbox.className = 'custom-checkbox';

        const textSpan = document.createElement('span');
        textSpan.className = 'option-text';
        textSpan.textContent = optionText;

        input.addEventListener('change', (e) => {
          this.handleMultipleChoiceChange(question.id, e.target.value, e.target.checked);
        });

        labelEl.appendChild(input);
        labelEl.appendChild(customCheckbox);
        labelEl.appendChild(textSpan);
        optionsGrid.appendChild(labelEl);
      });

      parentEl.appendChild(optionsGrid);
    },

    renderTextInput(parentEl, question) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'premium-text-input';
      input.placeholder = question.placeholder || 'Type your response here...';
      input.value = this.state.answers[question.id] || '';

      input.addEventListener('input', (e) => {
        this.handleAnswerChange(question.id, e.target.value);
      });

      parentEl.appendChild(input);
    },

    renderRangeSlider(parentEl, question) {
      const container = document.createElement('div');
      container.className = 'premium-range-container';

      const valueDisplay = document.createElement('div');
      valueDisplay.className = 'premium-range-value';
      
      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'premium-range-input';
      input.min = question.min || 0;
      input.max = question.max || 100;
      input.step = question.step || 1;
      input.value = this.state.answers[question.id] || input.min;

      valueDisplay.textContent = input.value;

      input.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
        this.handleAnswerChange(question.id, parseInt(e.target.value));
      });

      const labels = document.createElement('div');
      labels.className = 'premium-range-labels';
      labels.innerHTML = `
        <span>${question.minLabel || question.min || 0}</span>
        <span>${question.maxLabel || question.max || 100}</span>
      `;

      container.appendChild(valueDisplay);
      container.appendChild(input);
      container.appendChild(labels);
      parentEl.appendChild(container);
    },

    handleAnswerChange(questionId, value) {
      this.state.answers[questionId] = value;
    },

    handleMultipleChoiceChange(questionId, value, isChecked) {
      if (!Array.isArray(this.state.answers[questionId])) {
        this.state.answers[questionId] = [];
      }
      if (isChecked) {
        this.state.answers[questionId].push(value);
      } else {
        this.state.answers[questionId] = this.state.answers[questionId].filter(v => v !== value);
      }
    },

    updateProgress() {
      const progress = ((this.state.currentQuestionIndex + 1) / this.state.questions.length) * 100;
      this.elements.progressFill.style.width = progress + '%';
      this.elements.currentQuestion.textContent = this.state.currentQuestionIndex + 1;

      const isFirst = this.state.currentQuestionIndex === 0;
      const isLast = this.state.currentQuestionIndex === this.state.questions.length - 1;

      this.elements.backButton.style.display = isFirst ? 'none' : 'flex';
      this.elements.nextButton.style.display = isLast ? 'none' : 'flex';
      this.elements.submitButton.style.display = isLast ? 'flex' : 'none';
    },

    handleNext() {
      if (this.state.currentQuestionIndex < this.state.questions.length - 1) {
        this.state.currentQuestionIndex++;
        this.displayCurrentQuestion();
      }
    },

    handleBack() {
      if (this.state.currentQuestionIndex > 0) {
        this.state.currentQuestionIndex--;
        this.displayCurrentQuestion();
      }
    },

    handleSubmit() {
      // Save answers
      if (typeof Storage !== 'undefined' && typeof Storage.saveAnswers === 'function') {
        Storage.saveAnswers(this.state.answers);
      }

      this.elements.submitButton.disabled = true;
      this.elements.submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Finalizing Data...';

      // Route to Report page
      setTimeout(() => {
        window.location.href = '/report';
      }, 400);
    },

    handleSkip() {
      // Save empty/partial answers
      if (typeof Storage !== 'undefined' && typeof Storage.saveAnswers === 'function') {
        Storage.saveAnswers(this.state.answers);
      }

      this.elements.skipButton.disabled = true;
      this.elements.skipButton.textContent = 'Bypassing consultation...';

      setTimeout(() => {
        window.location.href = '/report';
      }, 400);
    },

    showError(message) {
      this.switchView('error');
      this.elements.errorMessage.textContent = message;
    },

    setupEventListeners() {
      if (this.elements.nextButton) {
        this.elements.nextButton.addEventListener('click', () => this.handleNext());
      }
      if (this.elements.backButton) {
        this.elements.backButton.addEventListener('click', () => this.handleBack());
      }
      if (this.elements.submitButton) {
        this.elements.submitButton.addEventListener('click', () => this.handleSubmit());
      }
      if (this.elements.skipButton) {
        this.elements.skipButton.addEventListener('click', () => this.handleSkip());
      }
      if (this.elements.retryButton) {
        this.elements.retryButton.addEventListener('click', () => location.reload());
      }

      // Keyboard navigation
      document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !this.state.isLoading && !this.state.hasError) {
          const isLast = this.state.currentQuestionIndex === this.state.questions.length - 1;
          if (isLast) {
            this.handleSubmit();
          } else {
            this.handleNext();
          }
        }
      });
    },
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    QuestionsPage.init();
  });

})();
