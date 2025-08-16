// PWA (Progressive Web App) Implementation
class PWA {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.isOnline = navigator.onLine;
    this.offlineData = [];
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
      
      // Initialize offline data storage
      this.initOfflineStorage();
      
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
          if (event.data && event.data.type === 'SYNC_COMPLETE') {
            console.log('Background sync completed:', event.data.message);
            this.showNotification('Background sync completed', 'success');
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
      this.showNotification('App installed successfully!', 'success');
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
      this.showNotification('You are now offline. Data will be saved locally.', 'info');
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

    // App focus
    window.addEventListener('focus', () => {
      this.onAppFocus();
    });

    // App blur
    window.addEventListener('blur', () => {
      this.onAppBlur();
    });
  }

  showInstallPrompt() {
    // Create install button if it doesn't exist
    if (!this.installButton) {
      this.createInstallButton();
    }
    
    this.installButton.style.display = 'block';
    this.installButton.addEventListener('click', () => {
      this.installApp();
    });
  }

  createInstallButton() {
    this.installButton = document.createElement('button');
    this.installButton.id = 'installAppBtn';
    this.installButton.className = 'install-app-btn';
    this.installButton.innerHTML = `
      <span>📱 Install App</span>
      <small>Add to home screen</small>
    `;
    
    // Style the install button
    this.installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 15px 25px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
      z-index: 1000;
      display: none;
      flex-direction: column;
      align-items: center;
      transition: all 0.3s ease;
    `;
    
    this.installButton.addEventListener('mouseenter', () => {
      this.installButton.style.transform = 'translateY(-2px)';
      this.installButton.style.boxShadow = '0 15px 30px rgba(102, 126, 234, 0.4)';
    });
    
    this.installButton.addEventListener('mouseleave', () => {
      this.installButton.style.transform = 'translateY(0)';
      this.installButton.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
    });
    
    document.body.appendChild(this.installButton);
  }

  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.hideInstallPrompt();
    }
  }

  hideInstallPrompt() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  updateOnlineStatus(isOnline) {
    const statusElement = document.getElementById('onlineStatus');
    if (statusElement) {
      statusElement.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
      statusElement.className = isOnline ? 'online' : 'offline';
    }
    
    // Update app behavior based on online status
    if (isOnline) {
      document.body.classList.remove('offline-mode');
      document.body.classList.add('online-mode');
    } else {
      document.body.classList.remove('online-mode');
      document.body.classList.add('offline-mode');
    }
  }

  initOfflineStorage() {
    // Initialize IndexedDB for offline data
    if ('indexedDB' in window) {
      this.initIndexedDB();
    } else {
      console.warn('IndexedDB not supported, using localStorage fallback');
      this.initLocalStorage();
    }
  }

  async initIndexedDB() {
    try {
      const request = indexedDB.open('AzernetInventoryDB', 2);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        this.initLocalStorage(); // Fallback to localStorage
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('IndexedDB initialized successfully');
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('inventory')) {
          const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
          inventoryStore.createIndex('name', 'name', { unique: false });
          inventoryStore.createIndex('type', 'type', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
          salesStore.createIndex('date', 'date', { unique: false });
          salesStore.createIndex('itemId', 'itemId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('purchases')) {
          const purchasesStore = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
          purchasesStore.createIndex('date', 'date', { unique: false });
          purchasesStore.createIndex('itemId', 'itemId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('offlineActions')) {
          const offlineStore = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
          offlineStore.createIndex('type', 'type', { unique: false });
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
      this.initLocalStorage();
    }
  }

  initLocalStorage() {
    // Initialize localStorage with default values
    if (!localStorage.getItem('azernet_inventory')) {
      localStorage.setItem('azernet_inventory', JSON.stringify([]));
    }
    if (!localStorage.getItem('azernet_sales')) {
      localStorage.setItem('azernet_sales', JSON.stringify([]));
    }
    if (!localStorage.getItem('azernet_purchases')) {
      localStorage.setItem('azernet_purchases', JSON.stringify([]));
    }
    if (!localStorage.getItem('azernet_offline_actions')) {
      localStorage.setItem('azernet_offline_actions', JSON.stringify([]));
    }
  }

  async saveOfflineAction(action) {
    const offlineAction = {
      type: action.type,
      data: action.data,
      timestamp: Date.now(),
      id: Date.now() + Math.random()
    };

    if (this.db) {
      // Save to IndexedDB
      const transaction = this.db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      await store.add(offlineAction);
    } else {
      // Save to localStorage
      const actions = JSON.parse(localStorage.getItem('azernet_offline_actions') || '[]');
      actions.push(offlineAction);
      localStorage.setItem('azernet_offline_actions', JSON.stringify(actions));
    }

    this.offlineData.push(offlineAction);
  }

  async syncOfflineData() {
    if (!this.isOnline || this.offlineData.length === 0) {
      return;
    }

    try {
      console.log('Syncing offline data...');
      
      for (const action of this.offlineData) {
        try {
          // Attempt to sync the action
          await this.syncAction(action);
          
          // Remove from offline storage if successful
          await this.removeOfflineAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
        }
      }
      
      this.offlineData = [];
      this.showNotification('Offline data synced successfully!', 'success');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      this.showNotification('Failed to sync offline data', 'error');
    }
  }

  async syncAction(action) {
    // This would typically make API calls to sync with the server
    // For now, we'll just log the action
    console.log('Syncing action:', action);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }

  async removeOfflineAction(actionId) {
    if (this.db) {
      const transaction = this.db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      await store.delete(actionId);
    } else {
      const actions = JSON.parse(localStorage.getItem('azernet_offline_actions') || '[]');
      const filteredActions = actions.filter(action => action.id !== actionId);
      localStorage.setItem('azernet_offline_actions', JSON.stringify(filteredActions));
    }
  }

  checkForUpdates() {
    // Check for app updates every hour
    setInterval(() => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
      }
    }, 60 * 60 * 1000);
  }

  showUpdateNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('App Update Available', {
        body: 'A new version of Azernet Inventory is available. Refresh to update.',
        icon: '/assets/logo.png',
        tag: 'app-update'
      });
      
      notification.onclick = () => {
        window.location.reload();
      };
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
      }
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `pwa-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">×</button>
      </div>
    `;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 300px;
      border-left: 4px solid;
      animation: slideInRight 0.3s ease;
    `;
    
    // Set border color based on type
    switch (type) {
      case 'success':
        notification.style.borderLeftColor = '#48bb78';
        break;
      case 'error':
        notification.style.borderLeftColor = '#f56565';
        break;
      case 'warning':
        notification.style.borderLeftColor = '#ed8936';
        break;
      default:
        notification.style.borderLeftColor = '#4299e1';
    }
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
    
    document.body.appendChild(notification);
  }

  onAppFocus() {
    console.log('App focused');
    // Resume any paused operations
    this.resumeOperations();
  }

  onAppBlur() {
    console.log('App blurred');
    // Pause any ongoing operations
    this.pauseOperations();
  }

  resumeOperations() {
    // Resume any paused operations
    console.log('Resuming operations...');
  }

  pauseOperations() {
    // Pause any ongoing operations
    console.log('Pausing operations...');
  }

  saveAppState() {
    // Save current app state before unload
    try {
      const appState = {
        currentPage: window.location.pathname,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      };
      
      localStorage.setItem('azernet_app_state', JSON.stringify(appState));
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }

  restoreAppState() {
    // Restore app state on load
    try {
      const savedState = localStorage.getItem('azernet_app_state');
      if (savedState) {
        const appState = JSON.parse(savedState);
        console.log('Restored app state:', appState);
        
        // You can implement state restoration logic here
        // For example, restoring scroll position, form data, etc.
      }
    } catch (error) {
      console.error('Failed to restore app state:', error);
    }
  }

  // Public methods for other parts of the app
  async saveInventoryItem(item) {
    if (this.isOnline) {
      // Save to server (implement your API call here)
      return await this.saveToServer(item);
    } else {
      // Save locally and queue for sync
      await this.saveLocally(item);
      await this.saveOfflineAction({
        type: 'SAVE_INVENTORY',
        data: item
      });
      return { success: true, offline: true };
    }
  }

  async saveToServer(item) {
    // Implement your server API call here
    console.log('Saving to server:', item);
    return { success: true, offline: false };
  }

  async saveLocally(item) {
    if (this.db) {
      const transaction = this.db.transaction(['inventory'], 'readwrite');
      const store = transaction.objectStore('inventory');
      await store.add(item);
    } else {
      const items = JSON.parse(localStorage.getItem('azernet_inventory') || '[]');
      items.push(item);
      localStorage.setItem('azernet_inventory', JSON.stringify(items));
    }
  }

  async getInventoryItems() {
    if (this.db) {
      const transaction = this.db.transaction(['inventory'], 'readonly');
      const store = transaction.objectStore('inventory');
      return await store.getAll();
    } else {
      return JSON.parse(localStorage.getItem('azernet_inventory') || '[]');
    }
  }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pwa = new PWA();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .pwa-notification .notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .pwa-notification .notification-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    margin-left: 10px;
  }
  
  .pwa-notification .notification-close:hover {
    color: #333;
  }
  
  .offline-mode {
    opacity: 0.8;
  }
  
  .offline-mode::before {
    content: '🔴 Offline Mode';
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #f56565;
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 12px;
    z-index: 1000;
  }
`;
document.head.appendChild(style);
