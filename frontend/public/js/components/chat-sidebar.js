// Chat Sidebar Component
// Handles AI-powered chat interactions with skin analysis context

class ChatSidebar {
  constructor() {
    this.messages = [];
    this.isLoading = false;
    this.messageCount = 0;
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
  }

  /**
   * Get HTML template for chat sidebar
   */
  getTemplate() {
    return `<!-- Chat Sidebar Component -->
<div id="chat-sidebar" class="chat-sidebar hidden">
  <!-- Header -->
  <div class="chat-header">
    <div class="chat-header-content">
      <h3>DermAI Assistant</h3>
      <p>Personalized skin care advice</p>
    </div>
    <button class="chat-close-btn" aria-label="Close chat">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16865249 C3.34915502,0.9115551 2.40734225,1.02284422 1.77946707,1.4941365 C0.994623095,2.12604706 0.837654326,3.0686314 1.15159189,3.85411826 L3.03521743,10.4951702 C3.03521743,10.6522676 3.19218622,10.809365 3.50612381,10.809365 L16.6915026,11.5948519 C16.6915026,11.5948519 17.1624089,11.5948519 17.1624089,11.0235597 L17.1624089,12.0661439 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"></path>
          </svg>
        </button>
      </div>
    </form>
    <p class="chat-disclaimer">Powered by AI - For informational purposes only</p>
  </div>
</div>

<!-- Chat Toggle Button (Floating) -->
<button id="chat-toggle-btn" class="chat-toggle-btn" aria-label="Open chat">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
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
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  /**
   * Initialize welcome message
   */
  initializeWelcomeMessage() {
    const skinData = sessionStorage.getItem('analysis');
    const answersData = sessionStorage.getItem('answers');
    
    let welcomeText = "Hello! I'm your DermAI Assistant. ";
    
    if (skinData) {
      try {
        const analysis = JSON.parse(skinData);
        welcomeText += `I've reviewed your skin analysis. How can I help improve your skincare routine?`;
      } catch (e) {
        welcomeText += "Feel free to ask questions about your skin analysis.";
      }
    } else {
      welcomeText += "Ask me anything about skincare and skin health.";
    }
    
    this.addMessage(welcomeText, 'assistant');
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();
    
    const message = this.inputField.value.trim();
    if (!message) return;
    
    // Add user message
    this.addMessage(message, 'user');
    this.inputField.value = '';
    this.inputField.focus();
    
    // Show typing indicator
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
      
      if (!response.ok) {
        throw new Error('Chat request failed');
      }
      
      const data = await response.json();
      this.addMessage(data.reply || data.response, 'assistant');
      this.scrollToBottom();
    } catch (error) {
      this.removeTypingIndicator();
      console.error('[v0] Chat error:', error);
      this.addMessage(
        "Sorry, I couldn't process your message. Please try again.",
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
    
    const contentEl = document.createElement('div');
    contentEl.className = 'chat-message-content';
    contentEl.textContent = text;
    
    messageEl.appendChild(contentEl);
    this.messagesContainer.appendChild(messageEl);
    
    this.messages.push({ text, sender, timestamp: Date.now() });
    
    // Update badge if message is from assistant and sidebar is closed
    if (sender === 'assistant' && this.sidebar.classList.contains('hidden')) {
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
    indicatorEl.className = 'chat-message assistant';
    indicatorEl.innerHTML = `
      <div class="chat-typing-indicator">
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
      </div>
    `;
    this.messagesContainer.appendChild(indicatorEl);
    this.scrollToBottom();
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    const indicator = this.messagesContainer.querySelector('.chat-typing-indicator');
    if (indicator) {
      indicator.closest('.chat-message').remove();
    }
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Toggle sidebar visibility
   */
  toggle() {
    if (this.sidebar.classList.contains('hidden')) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
   * Open sidebar
   */
  open() {
    this.sidebar.classList.remove('hidden');
    this.toggleBtn.classList.add('hidden');
    this.badge.classList.add('hidden');
    this.messageCount = 0;
    this.inputField.focus();
    this.scrollToBottom();
  }

  /**
   * Close sidebar
   */
  close() {
    this.sidebar.classList.add('hidden');
    this.toggleBtn.classList.remove('hidden');
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
