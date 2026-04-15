/**
 * Epiqora - Premium AI Chat Sidebar Component
 * Unobtrusive right-docked architecture with fluid neural animations.
 * Now fully integrated with the global Storage utility for flawless data handoff.
 */

class ChatSidebar {
  constructor() {
    this.messages = [];
    this.isLoading = false;
    this.messageCount = 0;
    this.isOpen = false;
    this.maxMessages = 5;
    this.usedMessages = 0;
    this.setupDOM();
    this.bindEvents();
    
    // Initialize welcome message smoothly after a short delay
    setTimeout(() => this.initializeWelcomeMessage(), 800);
  }

  setupDOM() {
    const chatTemplate = document.createElement('template');
    chatTemplate.innerHTML = this.getTemplate();
    document.body.appendChild(chatTemplate.content.cloneNode(true));

    this.sidebar = document.getElementById('chat-sidebar');
    this.messagesContainer = document.getElementById('chat-messages');
    this.inputField = document.getElementById('chat-input');
    this.form = document.getElementById('chat-form');
    this.toggleBtn = document.getElementById('chat-toggle-btn');
    this.closeBtn = document.querySelector('.chat-close-btn');
    this.badge = document.getElementById('chat-badge');
  }

  getTemplate() {
    return `
    <div id="chat-sidebar" class="chat-sidebar">
      <div class="chat-header">
        <div class="chat-header-content">
          <div class="chat-header-text">
            <h3>EpiqAI</h3>
            <p>AI Clinical Concierge</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="chat-limit-badge" id="chat-limit-badge">5 Left</div>
          <button class="chat-close-btn" aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="chat-messages" id="chat-messages"></div>

      <div class="chat-input-area">
        <form id="chat-form" class="chat-form">
          <div class="chat-input-wrapper">
            <input 
              type="text" 
              id="chat-input" 
              class="chat-input"
              placeholder="Ask about your routine...."
              autocomplete="off"
              maxlength="250"
            />
            <button type="submit" class="chat-send-btn" aria-label="Send message" id="chat-submit-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </form>
        <p class="chat-disclaimer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-2.33v8.02z"/>
          </svg>
          AI guidance — Always patch test new ingredients
        </p>
      </div>
    </div>

    <button id="chat-toggle-btn" class="chat-toggle-btn" aria-label="Open AI Concierge">
      <svg class="chat-icon-open" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="chat-toggle-text">Ask EpiqAI</span>
      <span class="chat-badge hidden" id="chat-badge">0</span>
    </button>`;
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.closeBtn.addEventListener('click', () => this.close());
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  initializeWelcomeMessage() {
    // FIX: Using your official Storage utility instead of direct sessionStorage
    const skinData = typeof Storage !== 'undefined' ? Storage.getAnalysis() : null;
    
    let welcomeText = "Hello! I am EpiqAI. ";
    
    if (skinData) {
      welcomeText += "I have securely processed your biometric report. I'm here to help you refine your new routine. What specific concerns can I address?";
    } else {
      welcomeText += "I'm your clinical skincare concierge. How can I assist you with your routine today?";
    }
    
    this.addMessage(welcomeText, 'assistant');
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const message = this.inputField.value.trim();
    if (!message || this.isLoading) return;

    if (this.usedMessages >= this.maxMessages) {
      this.addMessage("You have reached the maximum number of consultation messages for this session.", 'assistant');
      return;
    }
    
    // Add user message to UI
    this.addMessage(message, 'user');
    this.inputField.value = '';
    this.inputField.focus();
    
    this.isLoading = true;
    this.usedMessages++;
    this.updateLimitUI();

    document.getElementById('chat-submit-btn').disabled = true;
    this.showTypingIndicator();
    
    try {
      // FIX: Securely fetch pre-parsed data using your Storage utility class
      const skinData = typeof Storage !== 'undefined' ? Storage.getAnalysis() : null;
      const answersData = typeof Storage !== 'undefined' ? Storage.getAnswers() : null;
      const reportData = typeof Storage !== 'undefined' ? Storage.getReport() : null;
      
      // Filter out the welcome message to prevent AI context looping
      const chatHistory = this.messages
        .slice(0, -1) 
        .filter((msg, index) => !(index === 0 && msg.sender === 'assistant'))
        .map(msg => ({
          role: msg.sender,
          content: msg.text
        }));

      // Fallback to relative endpoint if API_BASE_URL isn't globally available
      const apiUrl = typeof API_BASE_URL !== 'undefined' ? `${API_BASE_URL}/api/chat` : '/api/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          // Since Storage.get...() already returns a parsed object, we pass them directly!
          analysis: skinData,
          answers: answersData,
          report: reportData,
          chatHistory: chatHistory
        })
      });
      
      this.removeTypingIndicator();
      this.isLoading = false;
      document.getElementById('chat-submit-btn').disabled = false;
      
      if (!response.ok) throw new Error('Chat API request failed');
      
      const data = await response.json();
      
      // Parse response based on API structure
      const replyText = (data.data && data.data.response) ? data.data.response : (data.reply || data.response);
      this.addMessage(replyText, 'assistant');
      
    } catch (error) {
      this.removeTypingIndicator();
      this.isLoading = false;
      this.usedMessages--; // Revert count if request failed
      this.updateLimitUI();
      document.getElementById('chat-submit-btn').disabled = false;
      console.error('[Epiqora] Chat AI Error:', error);
      this.addMessage(
        "I am currently experiencing a connection interruption with the neural engine. Please try your request again.",
        'assistant'
      );
    }
  }

  updateLimitUI() {
    const badge = document.getElementById('chat-limit-badge');
    const remaining = this.maxMessages - this.usedMessages;
    if (badge) {
      badge.textContent = `${remaining} Left`;
      if (remaining <= 1) {
        badge.className = 'chat-limit-badge warning';
      }
      if (remaining === 0) {
        badge.className = 'chat-limit-badge empty';
        this.inputField.disabled = true;
        this.inputField.placeholder = "Consultation limit reached.";
        document.getElementById('chat-submit-btn').disabled = true;
      }
    }
  }

  parseMarkdown(text) {
    if (!text) return '';
    let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Headers (convert to styled bold lines to keep chat tidy)
    html = html.replace(/^### (.*$)/gim, '<div class="chat-md-header">$1</div>');
    html = html.replace(/^## (.*$)/gim, '<div class="chat-md-header">$1</div>');
    html = html.replace(/^# (.*$)/gim, '<div class="chat-md-header">$1</div>');
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="chat-md-li">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="chat-md-li">$1</li>');
    html = html.replace(/(<li class="chat-md-li">.*<\/li>(\n|<br>)?)+/g, match => `<ul class="chat-md-ul">${match}</ul>`);
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    // Clean up loose breaks in lists
    html = html.replace(/<\/li><br>/g, '</li>');
    html = html.replace(/<br><ul/g, '<ul');
    html = html.replace(/<\/ul><br>/g, '</ul>');
    
    return html;
  }

  addMessage(text, sender = 'user') {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    
    if (sender === 'assistant') {
      const avatarEl = document.createElement('div');
      avatarEl.className = 'chat-avatar';
      avatarEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path></svg>`;
      messageEl.appendChild(avatarEl);
    }
    
    const contentEl = document.createElement('div');
    contentEl.className = 'chat-message-content';
    contentEl.innerHTML = this.parseMarkdown(text);
    
    messageEl.appendChild(contentEl);
    this.messagesContainer.appendChild(messageEl);
    this.messages.push({ text, sender, timestamp: Date.now() });
    
    // Update notification badge if closed
    if (sender === 'assistant' && !this.isOpen) {
      this.messageCount++;
      this.badge.textContent = this.messageCount;
      this.badge.classList.remove('hidden');
    }
    
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const indicatorEl = document.createElement('div');
    indicatorEl.className = 'chat-message assistant typing';
    indicatorEl.innerHTML = `
      <div class="chat-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path></svg>
      </div>
      <div class="chat-typing-indicator">
        <span class="chat-typing-pulse"></span>
        <span class="chat-typing-pulse"></span>
        <span class="chat-typing-pulse"></span>
      </div>
    `;
    this.messagesContainer.appendChild(indicatorEl);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const indicator = this.messagesContainer.querySelector('.chat-message.typing');
    if (indicator) indicator.remove();
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTo({
        top: this.messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.sidebar.classList.add('is-open');
    this.toggleBtn.classList.add('hidden');
    this.badge.classList.add('hidden');
    this.messageCount = 0;
    
    setTimeout(() => this.inputField.focus(), 300);
    this.scrollToBottom();
    
    // Only lock background scrolling on mobile devices
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden'; 
    }
  }

  close() {
    this.isOpen = false;
    this.sidebar.classList.remove('is-open');
    this.toggleBtn.classList.remove('hidden');
    document.body.style.overflow = ''; 
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.chatSidebar = new ChatSidebar();
});