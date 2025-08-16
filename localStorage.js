// Local Data Storage Management for Azernet Inventory
class LocalDataManager {
  constructor() {
    this.db = null;
    this.isIndexedDBSupported = 'indexedDB' in window;
    this.init();
  }

  async init() {
    if (this.isIndexedDBSupported) {
      await this.initIndexedDB();
    } else {
      this.initLocalStorage();
    }
    console.log('Local data manager initialized');
  }

  async initIndexedDB() {
    try {
      const request = indexedDB.open('AzernetInventoryDB', 3);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        this.initLocalStorage();
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
          inventoryStore.createIndex('userId', 'userId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
          salesStore.createIndex('date', 'date', { unique: false });
          salesStore.createIndex('itemId', 'itemId', { unique: false });
          salesStore.createIndex('userId', 'userId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('purchases')) {
          const purchasesStore = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
          purchasesStore.createIndex('date', 'date', { unique: false });
          purchasesStore.createIndex('itemId', 'itemId', { unique: false });
          purchasesStore.createIndex('userId', 'userId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          usersStore.createIndex('email', 'email', { unique: true });
          usersStore.createIndex('userId', 'userId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'id', autoIncrement: true });
          settingsStore.createIndex('userId', 'userId', { unique: false });
          settingsStore.createIndex('key', 'key', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('offlineActions')) {
          const offlineStore = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
          offlineStore.createIndex('type', 'type', { unique: false });
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
          offlineStore.createIndex('userId', 'userId', { unique: false });
        }
      };
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
      this.initLocalStorage();
    }
  }

  initLocalStorage() {
    // Initialize localStorage with default values
    const defaults = {
      'azernet_inventory': [],
      'azernet_sales': [],
      'azernet_purchases': [],
      'azernet_users': [],
      'azernet_settings': [],
      'azernet_offline_actions': []
    };

    Object.entries(defaults).forEach(([key, value]) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
  }

  // Inventory Management
  async saveInventoryItem(item, userId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['inventory'], 'readwrite');
        const store = transaction.objectStore('inventory');
        
        // Add userId to item
        const itemWithUser = { ...item, userId, timestamp: Date.now() };
        
        if (item.id) {
          // Update existing item
          await store.put(itemWithUser);
        } else {
          // Add new item
          const result = await store.add(itemWithUser);
          item.id = result;
        }
        
        return { success: true, id: item.id };
      } else {
        // Use localStorage
        const items = JSON.parse(localStorage.getItem('azernet_inventory') || '[]');
        
        if (item.id) {
          // Update existing item
          const index = items.findIndex(i => i.id === item.id);
          if (index !== -1) {
            items[index] = { ...item, userId, timestamp: Date.now() };
          }
        } else {
          // Add new item
          item.id = Date.now() + Math.random();
          items.push({ ...item, userId, timestamp: Date.now() });
        }
        
        localStorage.setItem('azernet_inventory', JSON.stringify(items));
        return { success: true, id: item.id };
      }
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      return { success: false, error: error.message };
    }
  }

  async getInventoryItems(userId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['inventory'], 'readonly');
        const store = transaction.objectStore('inventory');
        const items = await store.getAll();
        
        // Filter by userId if provided
        if (userId) {
          return items.filter(item => item.userId === userId);
        }
        return items;
      } else {
        const items = JSON.parse(localStorage.getItem('azernet_inventory') || '[]');
        
        // Filter by userId if provided
        if (userId) {
          return items.filter(item => item.userId === userId);
        }
        return items;
      }
    } catch (error) {
      console.error('Failed to get inventory items:', error);
      return [];
    }
  }

  async deleteInventoryItem(itemId, userId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['inventory'], 'readwrite');
        const store = transaction.objectStore('inventory');
        
        // Get the item first to check ownership
        const item = await store.get(itemId);
        if (item && item.userId === userId) {
          await store.delete(itemId);
          return { success: true };
        } else {
          return { success: false, error: 'Item not found or access denied' };
        }
      } else {
        const items = JSON.parse(localStorage.getItem('azernet_inventory') || '[]');
        const index = items.findIndex(item => item.id === itemId && item.userId === userId);
        
        if (index !== -1) {
          items.splice(index, 1);
          localStorage.setItem('azernet_inventory', JSON.stringify(items));
          return { success: true };
        } else {
          return { success: false, error: 'Item not found or access denied' };
        }
      }
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      return { success: false, error: error.message };
    }
  }

  // Sales Management
  async saveSale(sale, userId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        
        const saleWithUser = { ...sale, userId, timestamp: Date.now() };
        const result = await store.add(saleWithUser);
        
        // Update inventory quantity
        await this.updateInventoryQuantity(sale.itemId, -sale.quantity, userId);
        
        return { success: true, id: result };
      } else {
        const sales = JSON.parse(localStorage.getItem('azernet_sales') || '[]');
        sale.id = Date.now() + Math.random();
        sales.push({ ...sale, userId, timestamp: Date.now() });
        localStorage.setItem('azernet_sales', JSON.stringify(sales));
        
        // Update inventory quantity
        await this.updateInventoryQuantity(sale.itemId, -sale.quantity, userId);
        
        return { success: true, id: sale.id };
      }
    } catch (error) {
      console.error('Failed to save sale:', error);
      return { success: false, error: error.message };
    }
  }

  async getSales(userId, startDate = null, endDate = null) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        const sales = await store.getAll();
        
        let filteredSales = sales.filter(sale => sale.userId === userId);
        
        if (startDate && endDate) {
          filteredSales = filteredSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
          });
        }
        
        return filteredSales;
      } else {
        const sales = JSON.parse(localStorage.getItem('azernet_sales') || '[]');
        let filteredSales = sales.filter(sale => sale.userId === userId);
        
        if (startDate && endDate) {
          filteredSales = filteredSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
          });
        }
        
        return filteredSales;
      }
    } catch (error) {
      console.error('Failed to get sales:', error);
      return [];
    }
  }

  // Purchase Management
  async savePurchase(purchase, userId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['purchases'], 'readwrite');
        const store = transaction.objectStore('purchases');
        
        const purchaseWithUser = { ...purchase, userId, timestamp: Date.now() };
        const result = await store.add(purchaseWithUser);
        
        // Update inventory quantity
        await this.updateInventoryQuantity(purchase.itemId, purchase.quantity, userId);
        
        return { success: true, id: result };
      } else {
        const purchases = JSON.parse(localStorage.getItem('azernet_purchases') || '[]');
        purchase.id = Date.now() + Math.random();
        purchases.push({ ...purchase, userId, timestamp: Date.now() });
        localStorage.setItem('azernet_purchases', JSON.stringify(purchases));
        
        // Update inventory quantity
        await this.updateInventoryQuantity(purchase.itemId, purchase.quantity, userId);
        
        return { success: true, id: purchase.id };
      }
    } catch (error) {
      console.error('Failed to save purchase:', error);
      return { success: false, error: error.message };
    }
  }

  async getPurchases(userId, startDate = null, endDate = null) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['purchases'], 'readonly');
        const store = transaction.objectStore('purchases');
        const purchases = await store.getAll();
        
        let filteredPurchases = purchases.filter(purchase => purchase.userId === userId);
        
        if (startDate && endDate) {
          filteredPurchases = filteredPurchases.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            return purchaseDate >= startDate && purchaseDate <= endDate;
          });
        }
        
        return filteredPurchases;
      } else {
        const purchases = JSON.parse(localStorage.getItem('azernet_purchases') || '[]');
        let filteredPurchases = purchases.filter(purchase => purchase.userId === userId);
        
        if (startDate && endDate) {
          filteredPurchases = filteredPurchases.filter(purchase => {
            const purchaseDate = new Date(purchase.date);
            return purchaseDate >= startDate && purchaseDate <= endDate;
          });
        }
        
        return filteredPurchases;
      }
    } catch (error) {
      console.error('Failed to get purchases:', error);
      return [];
    }
  }

  // Inventory Quantity Updates
  async updateInventoryQuantity(itemId, quantityChange, userId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['inventory'], 'readwrite');
        const store = transaction.objectStore('inventory');
        
        const item = await store.get(itemId);
        if (item && item.userId === userId) {
          item.quantityValue = (item.quantityValue || 0) + quantityChange;
          if (item.quantityValue < 0) item.quantityValue = 0;
          
          await store.put(item);
        }
      } else {
        const items = JSON.parse(localStorage.getItem('azernet_inventory') || '[]');
        const item = items.find(i => i.id === itemId && i.userId === userId);
        
        if (item) {
          item.quantityValue = (item.quantityValue || 0) + quantityChange;
          if (item.quantityValue < 0) item.quantityValue = 0;
          
          localStorage.setItem('azernet_inventory', JSON.stringify(items));
        }
      }
    } catch (error) {
      console.error('Failed to update inventory quantity:', error);
    }
  }

  // Settings Management
  async saveSetting(key, value, userId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        // Check if setting already exists
        const index = store.index('key');
        const existingSetting = await index.get([key, userId]);
        
        if (existingSetting) {
          existingSetting.value = value;
          existingSetting.timestamp = Date.now();
          await store.put(existingSetting);
        } else {
          await store.add({
            key,
            value,
            userId,
            timestamp: Date.now()
          });
        }
        
        return { success: true };
      } else {
        const settings = JSON.parse(localStorage.getItem('azernet_settings') || '[]');
        const existingIndex = settings.findIndex(s => s.key === key && s.userId === userId);
        
        if (existingIndex !== -1) {
          settings[existingIndex].value = value;
          settings[existingIndex].timestamp = Date.now();
        } else {
          settings.push({
            key,
            value,
            userId,
            timestamp: Date.now()
          });
        }
        
        localStorage.setItem('azernet_settings', JSON.stringify(settings));
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to save setting:', error);
      return { success: false, error: error.message };
    }
  }

  async getSetting(key, userId) {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const index = store.index('key');
        const setting = await index.get([key, userId]);
        
        return setting ? setting.value : null;
      } else {
        const settings = JSON.parse(localStorage.getItem('azernet_settings') || '[]');
        const setting = settings.find(s => s.key === key && s.userId === userId);
        
        return setting ? setting.value : null;
      }
    } catch (error) {
      console.error('Failed to get setting:', error);
      return null;
    }
  }

  // Data Export/Import
  async exportData(userId) {
    try {
      const data = {
        inventory: await this.getInventoryItems(userId),
        sales: await this.getSales(userId),
        purchases: await this.getPurchases(userId),
        settings: [],
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Get settings
      if (this.db) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const settings = await store.getAll();
        data.settings = settings.filter(s => s.userId === userId);
      } else {
        const settings = JSON.parse(localStorage.getItem('azernet_settings') || '[]');
        data.settings = settings.filter(s => s.userId === userId);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  async importData(data, userId) {
    try {
      // Validate data structure
      if (!data.inventory || !data.sales || !data.purchases) {
        throw new Error('Invalid data format');
      }
      
      // Clear existing data for this user
      await this.clearUserData(userId);
      
      // Import new data
      for (const item of data.inventory) {
        await this.saveInventoryItem({ ...item, id: undefined }, userId);
      }
      
      for (const sale of data.sales) {
        await this.saveSale({ ...sale, id: undefined }, userId);
      }
      
      for (const purchase of data.purchases) {
        await this.savePurchase({ ...purchase, id: undefined }, userId);
      }
      
      for (const setting of data.settings) {
        await this.saveSetting(setting.key, setting.value, userId);
      }
      
      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      console.error('Failed to import data:', error);
      return { success: false, error: error.message };
    }
  }

  async clearUserData(userId) {
    try {
      if (this.db) {
        // Clear inventory
        const inventoryTransaction = this.db.transaction(['inventory'], 'readwrite');
        const inventoryStore = inventoryTransaction.objectStore('inventory');
        const inventoryItems = await inventoryStore.getAll();
        for (const item of inventoryItems) {
          if (item.userId === userId) {
            await inventoryStore.delete(item.id);
          }
        }
        
        // Clear sales
        const salesTransaction = this.db.transaction(['sales'], 'readwrite');
        const salesStore = salesTransaction.objectStore('sales');
        const salesItems = await salesStore.getAll();
        for (const sale of salesItems) {
          if (sale.userId === userId) {
            await salesStore.delete(sale.id);
          }
        }
        
        // Clear purchases
        const purchasesTransaction = this.db.transaction(['purchases'], 'readwrite');
        const purchasesStore = purchasesTransaction.objectStore('purchases');
        const purchasesItems = await purchasesStore.getAll();
        for (const purchase of purchasesItems) {
          if (purchase.userId === userId) {
            await purchasesStore.delete(purchase.id);
          }
        }
        
        // Clear settings
        const settingsTransaction = this.db.transaction(['settings'], 'readwrite');
        const settingsStore = settingsTransaction.objectStore('settings');
        const settingsItems = await settingsStore.getAll();
        for (const setting of settingsItems) {
          if (setting.userId === userId) {
            await settingsStore.delete(setting.id);
          }
        }
      } else {
        // Clear from localStorage
        const keys = ['azernet_inventory', 'azernet_sales', 'azernet_purchases', 'azernet_settings'];
        
        keys.forEach(key => {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          const filteredItems = items.filter(item => item.userId !== userId);
          localStorage.setItem(key, JSON.stringify(filteredItems));
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to clear user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility Methods
  async getStorageInfo() {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['inventory', 'sales', 'purchases', 'settings'], 'readonly');
        
        const inventoryCount = await transaction.objectStore('inventory').count();
        const salesCount = await transaction.objectStore('sales').count();
        const purchasesCount = await transaction.objectStore('purchases').count();
        const settingsCount = await transaction.objectStore('settings').count();
        
        return {
          type: 'IndexedDB',
          inventory: inventoryCount,
          sales: salesCount,
          purchases: purchasesCount,
          settings: settingsCount,
          total: inventoryCount + salesCount + purchasesCount + settingsCount
        };
      } else {
        const inventory = JSON.parse(localStorage.getItem('azernet_inventory') || '[]');
        const sales = JSON.parse(localStorage.getItem('azernet_sales') || '[]');
        const purchases = JSON.parse(localStorage.getItem('azernet_purchases') || '[]');
        const settings = JSON.parse(localStorage.getItem('azernet_settings') || '[]');
        
        return {
          type: 'localStorage',
          inventory: inventory.length,
          sales: sales.length,
          purchases: purchases.length,
          settings: settings.length,
          total: inventory.length + sales.length + purchases.length + settings.length
        };
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { type: 'unknown', error: error.message };
    }
  }
}

// Initialize local data manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.localDataManager = new LocalDataManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalDataManager;
}
