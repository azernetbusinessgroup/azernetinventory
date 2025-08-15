import firebaseService from './firebase-service.js';
import { onAuthStateChanged } from './firebase-config.js';

let inventory = [];
let currentUser = null;
let isEditMode = false;
let currentEditItemId = null;
let isSelectionMode = false;
let selectedItemIds = [];
let currentSellIndex = 0;
let multiSellData = {}; // Store form data for each item
let globalCustomerName = ''; // Store customer name for all items
let currentDetailItemId = null; // Track currently opened detail item

// Custom Notification System
function showNotification(message, type = 'success', title = '', duration = 5000) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const icon = document.createElement('span');
  icon.className = 'notification-icon';
  
  switch (type) {
    case 'error':
      icon.textContent = '✕';
      break;
    case 'warning':
      icon.textContent = '⚠';
      break;
    case 'info':
      icon.textContent = 'ℹ';
      break;
    default:
      icon.textContent = '✓';
  }
  
  const content = document.createElement('div');
  content.className = 'notification-content';
  
  if (title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'notification-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
  }
  
  const messageEl = document.createElement('div');
  messageEl.className = 'notification-message';
  messageEl.textContent = message;
  content.appendChild(messageEl);
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'notification-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => removeNotification(notification);
  
  notification.appendChild(icon);
  notification.appendChild(content);
  closeBtn.appendChild(closeBtn);
  
  container.appendChild(notification);
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => removeNotification(notification), duration);
  }
}

function removeNotification(notification) {
  notification.classList.add('hiding');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Custom Confirmation Modal
function showConfirmation(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmationModal');
    const titleEl = document.getElementById('confirmationTitle');
    const messageEl = document.getElementById('confirmationMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    const handleYes = () => {
      modal.close();
      cleanup();
      resolve(true);
    };
    
    const handleNo = () => {
      modal.close();
      cleanup();
      resolve(false);
    };
    
    const cleanup = () => {
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
    };
    
    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
    
    modal.showModal();
  });
}

// Success Modal
function showSuccessModal(message) {
  const modal = document.getElementById('successModal');
  const messageEl = document.getElementById('successMessage');
  const closeBtn = document.getElementById('successClose');
  
  messageEl.textContent = message;
  
  const handleClose = () => {
    modal.close();
    closeBtn.removeEventListener('click', handleClose);
  };
  
  closeBtn.addEventListener('click', handleClose);
  modal.showModal();
}

// Initialize Firebase Authentication
function initializeAuth() {
  onAuthStateChanged(firebaseService.auth, async (user) => {
    if (user) {
      // User is signed in
      currentUser = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || 'User'
      };
      
      // Get user profile from Firestore
      try {
        const userProfile = await firebaseService.getUserProfile(user.uid);
        if (userProfile) {
          currentUser.storeName = userProfile.storeName || currentUser.displayName + "'s Store";
          currentUser.profileImage = userProfile.profileImage || 'assets/profile.png';
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
      
      firebaseService.setCurrentUser(user);
      updateHeaderWithUserInfo();
      loadInventory();
      loadSettings();
    } else {
      // User is signed out, redirect to auth page
      window.location.href = 'auth.html';
    }
  });
}

// Load inventory from Firebase
function loadInventory() {
  if (!currentUser) return;
  
  try {
    // Subscribe to real-time inventory updates
    firebaseService.subscribeToInventory(currentUser.id, (items) => {
      inventory = items || [];
      renderInventory();
    });
  } catch (error) {
    console.error('Error loading inventory:', error);
    showNotification('Error loading inventory', 'error');
    inventory = [];
    renderInventory();
  }
}

// Save inventory item to Firebase
async function saveInventoryItem(item) {
  if (!currentUser) return;
  
  try {
    if (item.id && item.id.length <= 3) {
      // This is an existing item, update it
      await firebaseService.updateInventoryItem(item.id, item);
    } else {
      // This is a new item, add it
      const newId = await firebaseService.addInventoryItem(item);
      item.id = newId;
    }
  } catch (error) {
    console.error('Error saving inventory item:', error);
    showNotification('Error saving item', 'error');
    throw error;
  }
}

// Add new inventory item
async function addItem(name, type, purchasePrice, quantityType, quantityValue, amountInPack, sellingPrice, description, image, paymentStatus) {
  const item = { 
    name, 
    type, 
    purchasePrice, 
    quantityType, 
    quantityValue, 
    amountInPack, 
    sellingPrice, 
    description, 
    image: image || '',
    paymentStatus: paymentStatus || 'paid'
  };
  
  try {
    await saveInventoryItem(item);
    showNotification('Item added successfully');
  } catch (error) {
    showNotification('Failed to add item', 'error');
  }
}

// Update inventory item
async function updateItem(itemId, updates) {
  try {
    await firebaseService.updateInventoryItem(itemId, updates);
    showNotification('Item updated successfully');
  } catch (error) {
    console.error('Error updating item:', error);
    showNotification('Failed to update item', 'error');
  }
}

// Delete inventory item
async function deleteItem(itemId) {
  try {
    await firebaseService.deleteInventoryItem(itemId);
    showNotification('Item deleted successfully');
  } catch (error) {
    console.error('Error deleting item:', error);
    showNotification('Failed to delete item', 'error');
  }
}

// Load settings from Firebase
async function loadSettings() {
  if (!currentUser) return;
  
  try {
    const settings = await firebaseService.getSettings(currentUser.id);
    applySettings(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings to Firebase
async function saveSettings(settings) {
  if (!currentUser) return;
  
  try {
    await firebaseService.saveSettings(currentUser.id, settings);
    showNotification('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('Failed to save settings', 'error');
  }
}

// Apply settings to UI
function applySettings(settings) {
  // Apply inventory settings
  if (settings.inventorySettings) {
    const inventorySettings = settings.inventorySettings;
    
    // Apply toggle settings
    if (inventorySettings.showItemType !== undefined) {
      document.getElementById('showItemType').checked = inventorySettings.showItemType;
    }
    if (inventorySettings.showPurchasePrice !== undefined) {
      document.getElementById('showPurchasePrice').checked = inventorySettings.showPurchasePrice;
    }
    if (inventorySettings.showSellingPrice !== undefined) {
      document.getElementById('showSellingPrice').checked = inventorySettings.showSellingPrice;
    }
    if (inventorySettings.showDescription !== undefined) {
      document.getElementById('showDescription').checked = inventorySettings.showDescription;
    }
    if (inventorySettings.showStock !== undefined) {
      document.getElementById('showStock').checked = inventorySettings.showStock;
    }
    if (inventorySettings.showPaymentStatus !== undefined) {
      document.getElementById('showPaymentStatus').checked = inventorySettings.showPaymentStatus;
    }
  }
  
  // Apply store name
  if (settings.storeName) {
    document.getElementById('storeNameTitle').textContent = settings.storeName;
  }
}

// Save sales to Firebase
async function saveSale(saleData) {
  if (!currentUser) return;
  
  try {
    await firebaseService.addSale(saleData);
    showNotification('Sale recorded successfully');
  } catch (error) {
    console.error('Error saving sale:', error);
    showNotification('Failed to save sale', 'error');
  }
}

// Load sales from Firebase
async function loadSales(startDate, endDate) {
  if (!currentUser) return [];
  
  try {
    const sales = await firebaseService.getSales(currentUser.id, startDate, endDate);
    return sales;
  } catch (error) {
    console.error('Error loading sales:', error);
    showNotification('Failed to load sales', 'error');
    return [];
  }
}

// Update user profile
async function updateUserProfile(updates) {
  if (!currentUser) return;
  
  try {
    await firebaseService.updateUserProfile(currentUser.id, updates);
    showNotification('Profile updated successfully');
    
    // Update local user object
    Object.assign(currentUser, updates);
    updateHeaderWithUserInfo();
  } catch (error) {
    console.error('Error updating profile:', error);
    showNotification('Failed to update profile', 'error');
  }
}

// Upload profile image
async function uploadProfileImage(file) {
  if (!currentUser) return;
  
  try {
    const path = `profile-images/${currentUser.id}/${file.name}`;
    const downloadURL = await firebaseService.uploadImage(file, path);
    
    // Update user profile with new image URL
    await updateUserProfile({ profileImage: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    showNotification('Failed to upload image', 'error');
    throw error;
  }
}

// Logout function
async function logout() {
  try {
    await firebaseService.signOut();
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Error signing out:', error);
    showNotification('Error signing out', 'error');
  }
}

// Initialize the application
function initializeApp() {
  initializeAuth();
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // Profile edit buttons
  const editProfileBtn = document.getElementById('editProfileBtn');
  const editNameBtn = document.getElementById('editNameBtn');
  
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      // Trigger file input for profile image
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            await uploadProfileImage(file);
          } catch (error) {
            // Error already handled in uploadProfileImage
          }
        }
      };
      fileInput.click();
    });
  }
  
  if (editNameBtn) {
    editNameBtn.addEventListener('click', () => {
      const modal = document.getElementById('editNameModal');
      const input = document.getElementById('editNameInput');
      const saveBtn = document.getElementById('saveNameBtn');
      const cancelBtn = document.getElementById('cancelNameBtn');
      
      input.value = currentUser.displayName || '';
      
      const handleSave = async () => {
        const newName = input.value.trim();
        if (newName) {
          await updateUserProfile({ displayName: newName });
          modal.close();
          cleanup();
        }
      };
      
      const handleCancel = () => {
        modal.close();
        cleanup();
      };
      
      const cleanup = () => {
        saveBtn.removeEventListener('click', handleSave);
        cancelBtn.removeEventListener('click', handleCancel);
      };
      
      saveBtn.addEventListener('click', handleSave);
      cancelBtn.addEventListener('click', handleCancel);
      
      modal.showModal();
    });
  }
  
  // Settings save buttons
  const saveButtons = document.querySelectorAll('.save-btn');
  saveButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const settings = collectSettings();
      saveSettings(settings);
    });
  });
}

// Collect all settings from UI
function collectSettings() {
  const settings = {
    inventorySettings: {}
  };
  
  // Collect toggle settings
  const toggles = document.querySelectorAll('.toggle input[type="checkbox"]');
  toggles.forEach(toggle => {
    const settingName = toggle.id;
    if (settingName) {
      settings.inventorySettings[settingName] = toggle.checked;
    }
  });
  
  // Collect store name
  const storeName = document.getElementById('storeNameTitle')?.textContent;
  if (storeName) {
    settings.storeName = storeName;
  }
  
  return settings;
}

// Update header with user info
function updateHeaderWithUserInfo() {
  if (!currentUser) return;
  
  const profileImage = document.getElementById('profileImage');
  const profileImageLarge = document.getElementById('profileImageLarge');
  const profileName = document.getElementById('profileName');
  const storeNameTitle = document.getElementById('storeNameTitle');
  
  if (profileImage) {
    profileImage.src = currentUser.profileImage || 'assets/profile.png';
  }
  
  if (profileImageLarge) {
    profileImageLarge.src = currentUser.profileImage || 'assets/profile.png';
  }
  
  if (profileName) {
    profileName.textContent = currentUser.displayName || 'User';
  }
  
  if (storeNameTitle) {
    storeNameTitle.textContent = currentUser.storeName || currentUser.displayName + "'s Store";
  }
}

// Render inventory (placeholder - you'll need to implement this based on your existing renderInventory function)
function renderInventory() {
  // This should be implemented based on your existing inventory rendering logic
  console.log('Rendering inventory:', inventory);
  // TODO: Implement inventory rendering
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export functions for use in other modules
export {
  showNotification,
  showConfirmation,
  showSuccessModal,
  addItem,
  updateItem,
  deleteItem,
  saveSale,
  loadSales,
  updateUserProfile,
  uploadProfileImage,
  logout
};
