/**
 * Crisp Chat Service
 * Customer support chat widget integration
 */

interface CrispPayload {
  email?: string;
  name?: string;
  phone?: string;
  userId?: string;
  sessionId?: string;
}

class CrispService {
  /**
   * Initialize Crisp Chat
   */
  static initialize() {
    if (typeof window !== 'undefined' && !window.$crisp) {
      window.$crisp = [];
      window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

      const script = document.createElement('script');
      script.src = 'https://client.crisp.chat/l.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }

  /**
   * Set user data
   */
  static setUserData(payload: CrispPayload) {
    if (typeof window !== 'undefined' && window.$crisp) {
      if (payload.email) {
        window.$crisp.push(['set', 'user:email', payload.email]);
      }
      if (payload.name) {
        window.$crisp.push(['set', 'user:nickname', payload.name]);
      }
      if (payload.phone) {
        window.$crisp.push(['set', 'user:phone', payload.phone]);
      }
      if (payload.sessionId) {
        window.$crisp.push(['set', 'session:data', { sessionId: payload.sessionId }]);
      }
    }
  }

  /**
   * Open chat
   */
  static openChat() {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:open']);
    }
  }

  /**
   * Close chat
   */
  static closeChat() {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:close']);
    }
  }

  /**
   * Send message
   */
  static sendMessage(message: string) {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'message:send', ['text', message]]);
    }
  }
}

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

export default CrispService;