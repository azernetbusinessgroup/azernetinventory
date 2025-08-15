// PWA (Progressive Web App) Implementation
class PWA {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Check for app updates
      this.checkForUpdates();
      
      // Request notification permission
      this.requestNotificationPermission();
      
      console.log('PWA initialized successfully');
    } catch (error) {
      console.error('PWA initialization failed:', error);
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered successfully:', registration);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('Cache updated:', event.data.payload);
          }
        });

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    } else {
      console.warn('Service Worker not supported');
      throw new Error('Service Worker not supported');
    }
  }

  setupEventListeners() {
    // App install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('App was installed');
      this.hideInstallPrompt();
      this.deferredPrompt = null;
    });

    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus(true);
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus(false);
    });

    // Visibility change (app focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.onAppFocus();
      } else {
        this.onAppBlur();
      }
    });

    // Before unload (save state)
    window.addEventListener('beforeunload', () => {
      this.saveAppState();
    });
  }

  showInstallPrompt() {
    // Create install button if it doesn't exist
    if (!this.installButton) {
      this.installButton = document.createElement('button');
      this.installButton.id = 'pwa-install-btn';
      this.installButton.className = 'pwa-install-btn';
      this.installButton.innerHTML = `
        <span>📱 Install App</span>
        <small>Add to home screen</small>
      `;
      this.installButton.addEventListener('click', () => this.installApp());
      
      // Add styles
      this.addInstallButtonStyles();
      
      // Insert button into the page
      const container = document.querySelector('.app-container') || document.body;
      container.appendChild(this.installButton);
    }
    
    this.installButton.style.display = 'block';
  }

  hideInstallPrompt() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      this.deferredPrompt = null;
      this.hideInstallPrompt();
    }
  }

  addInstallButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 15px 25px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        z-index: 1000;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }
      
      .pwa-install-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
      }
      
      .pwa-install-btn small {
        font-size: 12px;
        opacity: 0.8;
        font-weight: 400;
      }
      
      .pwa-install-btn:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  updateOnlineStatus(isOnline) {
    const status = isOnline ? 'online' : 'offline';
    console.log(`App is now ${status}`);
    
    // Show offline indicator
    this.showOfflineIndicator(!isOnline);
    
    // Update any UI elements that depend on online status
    const onlineElements = document.querySelectorAll('[data-online-only]');
    const offlineElements = document.querySelectorAll('[data-offline-only]');
    
    onlineElements.forEach(el => {
      el.style.display = isOnline ? 'block' : 'none';
    });
    
    offlineElements.forEach(el => {
      el.style.display = isOnline ? 'none' : 'block';
    });
  }

  showOfflineIndicator(show) {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.className = 'offline-indicator';
      indicator.innerHTML = `
        <span>📶 You're offline</span>
        <small>Some features may be limited</small>
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        .offline-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ff6b6b;
          color: white;
          text-align: center;
          padding: 10px;
          font-size: 14px;
          font-weight: 600;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .offline-indicator small {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 400;
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(indicator);
    }
    
    indicator.style.display = show ? 'block' : 'none';
  }

  async syncOfflineData() {
    // Sync any offline data when coming back online
    try {
      const offlineData = this.getOfflineData();
      if (offlineData && offlineData.length > 0) {
        console.log('Syncing offline data...');
        // Implement your sync logic here
        this.clearOfflineData();
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  getOfflineData() {
    try {
      return JSON.parse(localStorage.getItem('offlineData') || '[]');
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return [];
    }
  }

  saveOfflineData(data) {
    try {
      const offlineData = this.getOfflineData();
      offlineData.push({
        ...data,
        timestamp: Date.now()
      });
      localStorage.setItem('offlineData', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  clearOfflineData() {
    try {
      localStorage.removeItem('offlineData');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      } catch (error) {
        console.error('Failed to request notification permission:', error);
      }
    }
  }

  showUpdateNotification() {
    const updateNotification = document.createElement('div');
    updateNotification.className = 'update-notification';
    updateNotification.innerHTML = `
      <div class="update-content">
        <span>🔄 New version available</span>
        <button id="update-btn" class="update-btn">Update Now</button>
        <button id="dismiss-update" class="dismiss-btn">Dismiss</button>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        z-index: 1002;
        max-width: 300px;
      }
      
      .update-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .update-btn, .dismiss-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .update-btn {
        background: white;
        color: #28a745;
        font-weight: 600;
      }
      
      .dismiss-btn {
        background: transparent;
        color: white;
        border: 1px solid white;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(updateNotification);
    
    // Add event listeners
    document.getElementById('update-btn').addEventListener('click', () => {
      this.updateApp();
    });
    
    document.getElementById('dismiss-update').addEventListener('click', () => {
      updateNotification.remove();
    });
  }

  async updateApp() {
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  }

  checkForUpdates() {
    // Check for updates every hour
    setInterval(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
      }
    }, 60 * 60 * 1000);
  }

  onAppFocus() {
    console.log('App focused');
    // Refresh data when app comes into focus
    this.refreshData();
  }

  onAppBlur() {
    console.log('App blurred');
    // Save state when app loses focus
    this.saveAppState();
  }

  async refreshData() {
    // Implement data refresh logic here
    try {
      // Example: refresh inventory data
      if (typeof window.refreshInventoryData === 'function') {
        await window.refreshInventoryData();
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }

  saveAppState() {
    try {
      // Save current app state to localStorage
      const appState = {
        currentScreen: this.getCurrentScreen(),
        timestamp: Date.now(),
        userData: this.getUserData()
      };
      localStorage.setItem('appState', JSON.stringify(appState));
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }

  getCurrentScreen() {
    // Determine current screen based on visible elements
    const screens = ['splash-screen', 'signin-screen', 'userdetails-screen', 'verification-screen', 'registration-complete-screen'];
    for (const screen of screens) {
      const element = document.getElementById(screen);
      if (element && !element.classList.contains('hidden')) {
        return screen;
      }
    }
    return 'unknown';
  }

  getUserData() {
    // Get user data from form inputs or other sources
    try {
      const userData = {};
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
      inputs.forEach(input => {
        if (input.value) {
          userData[input.id] = input.value;
        }
      });
      return userData;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return {};
    }
  }

  // Utility method to send push notifications
  async sendNotification(title, body, data = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/assets/logo.png',
          badge: '/assets/logo.png',
          data,
          requireInteraction: false,
          silent: false
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        return notification;
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pwa = new PWA();
});

// Initialize PWA immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pwa = new PWA();
  });
} else {
  window.pwa = new PWA();
}
