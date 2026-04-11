// Chat Sidebar Component
// Handles AI-powered chat interactions with skin analysis context

class ChatSidebar {
  constructor() {
    this.messages = [];
    this.isLoading = false;
    this.messageCount = 0;
    this.isOpen = false;
    this.setupDOM();
    this.bindEvents();
    this.initializeWelcomeMessage();
  }

  /**
   * Setup DOM elements
   */
  setupDOM() {
    // Create sidebar HTML from template
    const chatTemplate = document.createElement('template');
    chatTemplate.innerHTML = this.getTemplate();
    document.body.appendChild(chatTemplate.content.cloneNode(true));

    // Cache DOM references
    this.sidebar = document.getElementById('chat-sidebar');
    this.messagesContainer = document.getElementById('chat-messages');
    this.inputField = document.getElementById('chat-input');
    this.form = document.getElementById('chat-form');
    this.toggleBtn = document.getElementById('chat-toggle-btn');
    this.closeBtn = document.querySelector('.chat-close-btn');
    this.badge = document.getElementById('chat-badge');
    this.overlay = document.getElementById('chat-overlay');
  }

  /**
   * Get HTML template for chat sidebar
   */
  getTemplate() {
    return `<!-- Chat Overlay -->
<div id="chat-overlay" class="chat-overlay"></div>

<!-- Chat Sidebar Component -->
<div id="chat-sidebar" class="chat-sidebar">
  <!-- Header -->
  <div class="chat-header">
    <div class="chat-header-content">
      <div class="chat-header-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div class="chat-header-text">
        <h3>EpiqAI Assistant</h3>
        <p>Your personal skincare advisor</p>
      </div>
    </div>
    <button class="chat-close-btn" aria-label="Close chat">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>

  <!-- Messages Container -->
  <div class="chat-messages" id="chat-messages">
    <!-- Messages will be dynamically inserted here -->
  </div>

  <!-- Input Area -->
  <div class="chat-input-area">
    <form id="chat-form" class="chat-form">
      <div class="chat-input-wrapper">
        <input 
          type="text" 
          id="chat-input" 
          class="chat-input"
          placeholder="Ask about your skin analysis..."
          autocomplete="off"
          maxlength="500"
        />
        <button type="submit" class="chat-send-btn" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </form>
    <p class="chat-disclaimer">
      <span class="chat-disclaimer-icon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </span>
      AI-powered advice - For informational purposes only
    </p>
  </div>
</div>

<!-- Chat Toggle Button (Floating) -->
<button id="chat-toggle-btn" class="chat-toggle-btn" aria-label="Open chat assistant">
  <svg class="chat-icon-open" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
  </svg>
  <span class="chat-badge" id="chat-badge">1</span>
</button>`;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Form will handle submit
      }
    });
  }

  /**
   * Initialize welcome message
   */
  initializeWelcomeMessage() {
    const skinData = sessionStorage.getItem('analysis');
    const answersData = sessionStorage.getItem('answers');
    
    let welcomeText = "Hello! I'm your EpiqAI Assistant. ";
    
    if (skinData) {
      try {
        const analysis = JSON.parse(skinData);
        welcomeText += "I've reviewed your skin analysis and I'm here to help you understand your results and optimize your skincare routine. What would you like to know?";
      } catch (e) {
        welcomeText += "Feel free to ask me any questions about your skin analysis or skincare routine.";
      }
    } else {
      welcomeText += "I'm here to help with skincare questions and personalized recommendations. How can I assist you today?";
    }
    
    this.addMessage(welcomeText, 'assistant');
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();
    
    const message = this.inputField.value.trim();
    if (!message || this.isLoading) return;
    
    // Add user message
    this.addMessage(message, 'user');
    this.inputField.value = '';
    this.inputField.focus();
    
    // Show typing indicator
    this.isLoading = true;
    this.showTypingIndicator();
    
    try {
      // Get context data
      const skinData = sessionStorage.getItem('analysis');
      const answersData = sessionStorage.getItem('answers');
      
      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          analysis: skinData ? JSON.parse(skinData) : null,
          answers: answersData ? JSON.parse(answersData) : null
        })
      });
      
      // Remove typing indicator
      this.removeTypingIndicator();
      this.isLoading = false;
      
      if (!response.ok) {
        throw new Error('Chat request failed');
      }
      
      const data = await response.json();
      this.addMessage(data.reply || data.response, 'assistant');
      this.scrollToBottom();
    } catch (error) {
      this.removeTypingIndicator();
      this.isLoading = false;
      console.error('[Epiqora] Chat error:', error);
      this.addMessage(
        "I apologize, but I couldn't process your message at this time. Please try again in a moment.",
        'assistant'
      );
    }
  }

  /**
   * Add message to chat
   */
  addMessage(text, sender = 'user') {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    
    // Add avatar for assistant messages
    if (sender === 'assistant') {
      const avatarEl = document.createElement('div');
      avatarEl.className = 'chat-avatar';
      avatarEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`;
      messageEl.appendChild(avatarEl);
    }
    
    const contentEl = document.createElement('div');
    contentEl.className = 'chat-message-content';
    contentEl.textContent = text;
    
    messageEl.appendChild(contentEl);
    this.messagesContainer.appendChild(messageEl);
    
    this.messages.push({ text, sender, timestamp: Date.now() });
    
    // Update badge if message is from assistant and sidebar is closed
    if (sender === 'assistant' && !this.isOpen) {
      this.messageCount++;
      this.badge.textContent = this.messageCount;
      this.badge.classList.remove('hidden');
    }
    
    this.scrollToBottom();
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const indicatorEl = document.createElement('div');
    indicatorEl.className = 'chat-message assistant typing';
    indicatorEl.innerHTML = `
      <div class="chat-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div class="chat-typing-indicator">
        <span class="chat-typing-dot"></span>
        <span class="chat-typing-dot"></span>
        <span class="chat-typing-dot"></span>
      </div>
    `;
    this.messagesContainer.appendChild(indicatorEl);
    this.scrollToBottom();
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    const indicator = this.messagesContainer.querySelector('.chat-message.typing');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    });
  }

  /**
   * Toggle sidebar visibility
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open sidebar
   */
  open() {
    this.isOpen = true;
    this.sidebar.classList.add('is-open');
    this.overlay.classList.add('is-visible');
    this.toggleBtn.classList.add('hidden');
    this.badge.classList.add('hidden');
    this.messageCount = 0;
    
    // Focus input after animation
    setTimeout(() => {
      this.inputField.focus();
    }, 300);
    
    this.scrollToBottom();
    
    // Prevent body scroll on mobile
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close sidebar
   */
  close() {
    this.isOpen = false;
    this.sidebar.classList.remove('is-open');
    this.overlay.classList.remove('is-visible');
    this.toggleBtn.classList.remove('hidden');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Clear all messages
   */
  clear() {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
    this.messageCount = 0;
    this.badge.classList.add('hidden');
    this.initializeWelcomeMessage();
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.messages;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatSidebar = new ChatSidebar();
});
