// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJiXOOAF2D7K8O4iJXfNVVaji_Mfxzemc",
  authDomain: "azernet-inventory-9d886.firebaseapp.com",
  projectId: "azernet-inventory-9d886",
  storageBucket: "azernet-inventory-9d886.firebasestorage.app",
  messagingSenderId: "93605541586",
  appId: "1:93605541586:web:8f59d43c71ef7aafa51f0b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let inventory = [];
let db;
let currentUser = null;
let isEditMode = false;
let currentEditItemId = null;
let isSelectionMode = false;
let selectedItemIds = [];
let currentSellIndex = 0;
let multiSellData = {}; // Store form data for each item
let globalCustomerName = ''; // Store customer name for all items
let currentDetailItemId = null; // Track currently opened detail item
let currentLanguage = 'en'; // Current language (en or am)
let translations = {}; // Store language translations

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
  notification.appendChild(closeBtn);
  
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

// Language Management Functions
async function loadLanguage(lang) {
  try {
    console.log('Loading language:', lang);
    const response = await fetch(`${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang}.json`);
    }
    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem('currentLanguage', lang);
    console.log('Language loaded successfully:', translations);
    
    // Wait a bit for DOM to be ready, then apply translations
    setTimeout(() => {
      applyTranslations();
    }, 100);
  } catch (error) {
    console.error('Failed to load language file:', error);
    // Fallback to English if language file fails to load
    if (lang !== 'en') {
      console.log('Falling back to English');
      await loadLanguage('en');
    }
  }
}

function applyTranslations() {
  console.log('Applying translations for language:', currentLanguage);
  console.log('Available translations:', translations);
  
  // Apply translations to all translatable elements
  const elements = {
    // App title
    'storeNameTitle': document.getElementById('storeNameTitle'),
    
    // Search
    'search': document.getElementById('search'),
    
    // Footer buttons
    'addItem': document.getElementById('addItem'),
    'quickReport': document.getElementById('quickReport'),
    'sell': document.getElementById('sell'),
    
    // Modal titles and content
    'confirmationTitle': document.getElementById('confirmationTitle'),
    'confirmationMessage': document.getElementById('confirmationMessage'),
    'confirmYes': document.getElementById('confirmYes'),
    'confirmNo': document.getElementById('confirmNo'),
    
    // Success modal
    'successMessage': document.getElementById('successMessage'),
    'successClose': document.getElementById('successClose'),
    
    // Edit name modal
    'editNameInput': document.getElementById('editNameInput'),
    'saveNameBtn': document.getElementById('saveNameBtn'),
    'cancelNameBtn': document.getElementById('cancelNameBtn'),
    
    // Sale confirmation modal
    'confirmationTotal': document.getElementById('confirmationTotal'),
    
    // Settings dropdown items
    'inventorySettingsItem': document.querySelector('[data-settings="inventory"]'),
    'accountsSettingsItem': document.querySelector('[data-settings="accounts"]'),
    'detailedSettingsItem': document.querySelector('[data-settings="detailed"]'),
    'languageSettingsItem': document.querySelector('[data-settings="language"]'),
    'contactSettingsItem': document.querySelector('[data-settings="contact"]'),
    'aboutSettingsItem': document.querySelector('[data-settings="about"]'),
    
    // Language settings page
    'languageSettingsTitle': document.getElementById('languageSettingsTitle'),
    'currentLanguageTitle': document.getElementById('currentLanguageTitle'),
    'selectLanguageTitle': document.getElementById('selectLanguageTitle'),
    'currentLanguageDisplay': document.getElementById('currentLanguageDisplay'),
    'languageSaveBtn': document.getElementById('languageSaveBtn'),
    'englishOption': document.getElementById('englishOption'),
    'amharicOption': document.getElementById('amharicOption'),
    
    // Sale confirmation modal
    'saleConfirmationTitle': document.getElementById('saleConfirmationTitle'),
    'totalPriceLabel': document.getElementById('totalPriceLabel')
  };
  
  // Apply translations if elements exist
  if (elements.storeNameTitle) {
    const storeName = getTranslation('app.storeName');
    if (storeName) {
      elements.storeNameTitle.textContent = storeName;
      console.log('Updated store name to:', storeName);
    }
  }
  
  if (elements.search) {
    const placeholder = getTranslation('search.placeholder');
    if (placeholder) {
      elements.search.placeholder = placeholder;
      console.log('Updated search placeholder to:', placeholder);
    }
  }
  
  if (elements.addItem) {
    const addItemText = getTranslation('footer.addItem');
    if (addItemText) {
      elements.addItem.textContent = addItemText;
      console.log('Updated add item button to:', addItemText);
    }
  }
  
  if (elements.quickReport) {
    const quickReportText = getTranslation('footer.quickReport');
    if (quickReportText) {
      elements.quickReport.textContent = quickReportText;
      console.log('Updated quick report button to:', quickReportText);
    }
  }
  
  if (elements.sell) {
    const sellText = getTranslation('footer.sellItems');
    if (sellText) {
      elements.sell.textContent = sellText;
      console.log('Updated sell button to:', sellText);
    }
  }
  
  if (elements.confirmationTitle) {
    const title = getTranslation('modals.confirmation.title');
    if (title) {
      elements.confirmationTitle.textContent = title;
    }
  }
  
  if (elements.confirmationMessage) {
    const message = getTranslation('modals.confirmation.message');
    if (message) {
      elements.confirmationMessage.textContent = message;
    }
  }
  
  if (elements.confirmYes) {
    const yesText = getTranslation('modals.confirmation.yes');
    if (yesText) {
      elements.confirmYes.textContent = yesText;
    }
  }
  
  if (elements.confirmNo) {
    const noText = getTranslation('modals.confirmation.no');
    if (noText) {
      elements.confirmNo.textContent = noText;
    }
  }
  
  if (elements.successMessage) {
    const successMessage = getTranslation('modals.success.message');
    if (successMessage) {
      elements.successMessage.textContent = successMessage;
    }
  }
  
  if (elements.successClose) {
    const closeText = getTranslation('modals.success.ok');
    if (closeText) {
      elements.successClose.textContent = closeText;
    }
  }
  
  if (elements.editNameInput) {
    const placeholder = getTranslation('modals.editName.placeholder');
    if (placeholder) {
      elements.editNameInput.placeholder = placeholder;
    }
  }
  
  if (elements.saveNameBtn) {
    const saveText = getTranslation('modals.editName.save');
    if (saveText) {
      elements.saveNameBtn.textContent = saveText;
    }
  }
  
  if (elements.cancelNameBtn) {
    const cancelText = getTranslation('modals.editName.cancel');
    if (cancelText) {
      elements.cancelNameBtn.textContent = cancelText;
    }
  }
  
  // Settings dropdown items
  if (elements.inventorySettingsItem) {
    const title = getTranslation('settings.inventory.title');
    if (title) {
      elements.inventorySettingsItem.textContent = title;
    }
  }
  
  if (elements.accountsSettingsItem) {
    const title = getTranslation('settings.accounts.title');
    if (title) {
      elements.accountsSettingsItem.textContent = title;
    }
  }
  
  if (elements.detailedSettingsItem) {
    const title = getTranslation('settings.detailed.title');
    if (title) {
      elements.detailedSettingsItem.textContent = title;
    }
  }
  
  if (elements.languageSettingsItem) {
    const title = getTranslation('settings.language.title');
    if (title) {
      elements.languageSettingsItem.textContent = title;
    }
  }
  
  if (elements.contactSettingsItem) {
    const title = getTranslation('settings.contact.title');
    if (title) {
      elements.contactSettingsItem.textContent = title;
    }
  }
  
  if (elements.aboutSettingsItem) {
    const title = getTranslation('settings.about.title');
    if (title) {
      elements.aboutSettingsItem.textContent = title;
    }
  }
  
  // Language settings page
  if (elements.languageSettingsTitle) {
    const title = getTranslation('settings.language.title');
    if (title) {
      elements.languageSettingsTitle.textContent = title;
    }
  }
  
  if (elements.currentLanguageTitle) {
    const title = getTranslation('settings.language.currentLanguage');
    if (title) {
      elements.currentLanguageTitle.textContent = title;
    }
  }
  
  if (elements.selectLanguageTitle) {
    const title = getTranslation('settings.language.selectLanguage');
    if (title) {
      elements.selectLanguageTitle.textContent = title;
    }
  }
  
  if (elements.currentLanguageDisplay) {
    const languageText = getTranslation(`settings.language.languages.${currentLanguage}`);
    if (languageText) {
      elements.currentLanguageDisplay.textContent = languageText;
    }
  }
  
  if (elements.languageSaveBtn) {
    const saveText = getTranslation('settings.language.save');
    if (saveText) {
      elements.languageSaveBtn.textContent = saveText;
    }
  }
  
  if (elements.englishOption) {
    const englishText = getTranslation('settings.language.languages.en');
    if (englishText) {
      elements.englishOption.textContent = englishText;
    }
  }
  
  if (elements.amharicOption) {
    const amharicText = getTranslation('settings.language.languages.am');
    if (amharicText) {
      elements.amharicOption.textContent = amharicText;
    }
  }
  
  // Sale confirmation modal
  if (elements.saleConfirmationTitle) {
    const title = getTranslation('modals.saleConfirmation.title');
    if (title) {
      elements.saleConfirmationTitle.textContent = title;
    }
  }
  
  if (elements.totalPriceLabel) {
    const totalText = getTranslation('modals.saleConfirmation.totalPrice');
    const currency = getTranslation('modals.saleConfirmation.currency');
    if (totalText && currency) {
      elements.totalPriceLabel.innerHTML = `${totalText} <span id="confirmationTotal">0</span> ${currency}`;
    }
  }
  
  // Update document title
  const appTitle = getTranslation('app.title');
  if (appTitle) {
    document.title = appTitle;
  }
}

function getTranslation(key) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }
  
  return value;
}

async function changeLanguage(newLang) {
  console.log('Changing language from', currentLanguage, 'to', newLang);
  if (newLang !== currentLanguage) {
    await loadLanguage(newLang);
    
    // Update the language selector to reflect the change
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
      languageSelector.value = newLang;
    }
    
    // Update the current language display
    const currentLanguageDisplay = document.getElementById('currentLanguageDisplay');
    if (currentLanguageDisplay) {
      const languageText = getTranslation(`settings.language.languages.${newLang}`);
      if (languageText) {
        currentLanguageDisplay.textContent = languageText;
      }
    }
    
    console.log('Language changed successfully to:', newLang);
  }
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

// Success Message Modal
function showSuccess(message) {
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

// Input Validation Functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEthiopianPhone(phone) {
  // Ethiopian phone format: +251XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)
  const phoneRegex = /^(\+251|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function markInputError(input, message = '') {
  input.classList.add('input-error');
  
  // Remove existing error message
  const existingError = input.parentNode.querySelector('.input-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add new error message if provided
  if (message) {
    const errorEl = document.createElement('span');
    errorEl.className = 'input-error-message';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }
}

function clearInputError(input) {
  input.classList.remove('input-error');
  const errorEl = input.parentNode.querySelector('.input-error-message');
  if (errorEl) {
    errorEl.remove();
  }
}

// Profile Name Edit Modal
function showEditNameModal() {
  const modal = document.getElementById('editNameModal');
  const input = document.getElementById('editNameInput');
  const saveBtn = document.getElementById('saveNameBtn');
  const cancelBtn = document.getElementById('cancelNameBtn');
  
  input.value = currentUser?.name || '';
  input.focus();
  
  const handleSave = () => {
    const newName = input.value.trim();
    if (!newName) {
      markInputError(input, 'Name cannot be empty');
      return;
    }
    
    currentUser.name = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateHeaderWithUserInfo();
    
    modal.close();
    showNotification('Name updated successfully', 'success');
    
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleCancel = () => {
    modal.close();
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  
  modal.showModal();
}

// Check if user is logged in
function checkAuth() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) {
    showNotification('Please log in first', 'error', 'Authentication Required');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
  try {
    currentUser = JSON.parse(userData);
    // Always update header with latest info from localStorage
    updateHeaderWithUserInfo();
    return true;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('currentUser');
    showNotification('Session expired. Please log in again.', 'error', 'Authentication Error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
}

function updateHeaderWithUserInfo() {
  // Always get latest currentUser from localStorage
  const userData = localStorage.getItem('currentUser');
  if (!userData) return;
  currentUser = JSON.parse(userData);

  const storeNameTitle = document.getElementById('storeNameTitle');
  if (storeNameTitle) storeNameTitle.textContent = currentUser.storeName || 'Store Name';

  const profileImage = document.getElementById('profileImage');
  const profileImageLarge = document.getElementById('profileImageLarge');
  const profileName = document.getElementById('profileName');

  const imgSrc = currentUser.profileImage || 'assets/profile.png';
  if (profileImage) profileImage.src = imgSrc;
  if (profileImageLarge) profileImageLarge.src = imgSrc;
  if (profileName) profileName.textContent = currentUser.name || 'User';
}

// When updating account info (store name, username, store type), always update localStorage and UI
async function handleSettingChange(input, label) {
  const newValue = input.value.trim();

  if (!newValue) {
    showNotification('Please enter a value', 'error', 'Validation Error');
    return;
  }

  if (input.id === 'newStoreName') {
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your store name?');
    if (confirmed) {
      currentUser.storeName = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('storeName', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Store name updated successfully!', 'success');
    }
  } else if (input.id === 'newStoreType') {
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your store type?');
    if (confirmed) {
      currentUser.storeType = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('storeType', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Store type updated successfully!', 'success');
    }
  } else if (input.id === 'editNameInput') {
    // For username change
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your username?');
    if (confirmed) {
      currentUser.name = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('name', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Username updated successfully!', 'success');
    }
  }
  input.value = '';
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

// Success Message Modal
function showSuccess(message) {
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

// Input Validation Functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEthiopianPhone(phone) {
  // Ethiopian phone format: +251XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)
  const phoneRegex = /^(\+251|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function markInputError(input, message = '') {
  input.classList.add('input-error');
  
  // Remove existing error message
  const existingError = input.parentNode.querySelector('.input-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add new error message if provided
  if (message) {
    const errorEl = document.createElement('span');
    errorEl.className = 'input-error-message';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }
}

function clearInputError(input) {
  input.classList.remove('input-error');
  const errorEl = input.parentNode.querySelector('.input-error-message');
  if (errorEl) {
    errorEl.remove();
  }
}

// Profile Name Edit Modal
function showEditNameModal() {
  const modal = document.getElementById('editNameModal');
  const input = document.getElementById('editNameInput');
  const saveBtn = document.getElementById('saveNameBtn');
  const cancelBtn = document.getElementById('cancelNameBtn');
  
  input.value = currentUser?.name || '';
  input.focus();
  
  const handleSave = () => {
    const newName = input.value.trim();
    if (!newName) {
      markInputError(input, 'Name cannot be empty');
      return;
    }
    
    currentUser.name = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateHeaderWithUserInfo();
    
    modal.close();
    showNotification('Name updated successfully', 'success');
    
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleCancel = () => {
    modal.close();
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  
  modal.showModal();
}

// Check if user is logged in
function checkAuth() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) {
    showNotification('Please log in first', 'error', 'Authentication Required');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
  try {
    currentUser = JSON.parse(userData);
    // Always update header with latest info from localStorage
    updateHeaderWithUserInfo();
    return true;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('currentUser');
    showNotification('Session expired. Please log in again.', 'error', 'Authentication Error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
}

function updateHeaderWithUserInfo() {
  // Always get latest currentUser from localStorage
  const userData = localStorage.getItem('currentUser');
  if (!userData) return;
  currentUser = JSON.parse(userData);

  const storeNameTitle = document.getElementById('storeNameTitle');
  if (storeNameTitle) storeNameTitle.textContent = currentUser.storeName || 'Store Name';

  const profileImage = document.getElementById('profileImage');
  const profileImageLarge = document.getElementById('profileImageLarge');
  const profileName = document.getElementById('profileName');

  const imgSrc = currentUser.profileImage || 'assets/profile.png';
  if (profileImage) profileImage.src = imgSrc;
  if (profileImageLarge) profileImageLarge.src = imgSrc;
  if (profileName) profileName.textContent = currentUser.name || 'User';
}

// When updating account info (store name, username, store type), always update localStorage and UI
async function handleSettingChange(input, label) {
  const newValue = input.value.trim();

  if (!newValue) {
    showNotification('Please enter a value', 'error', 'Validation Error');
    return;
  }

  if (input.id === 'newStoreName') {
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your store name?');
    if (confirmed) {
      currentUser.storeName = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('storeName', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Store name updated successfully!', 'success');
    }
  } else if (input.id === 'newStoreType') {
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your store type?');
    if (confirmed) {
      currentUser.storeType = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('storeType', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Store type updated successfully!', 'success');
    }
  } else if (input.id === 'editNameInput') {
    // For username change
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your username?');
    if (confirmed) {
      currentUser.name = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('name', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Username updated successfully!', 'success');
    }
  }
  input.value = '';
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

// Success Message Modal
function showSuccess(message) {
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

// Input Validation Functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEthiopianPhone(phone) {
  // Ethiopian phone format: +251XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)
  const phoneRegex = /^(\+251|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function markInputError(input, message = '') {
  input.classList.add('input-error');
  
  // Remove existing error message
  const existingError = input.parentNode.querySelector('.input-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add new error message if provided
  if (message) {
    const errorEl = document.createElement('span');
    errorEl.className = 'input-error-message';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }
}

function clearInputError(input) {
  input.classList.remove('input-error');
  const errorEl = input.parentNode.querySelector('.input-error-message');
  if (errorEl) {
    errorEl.remove();
  }
}

// Profile Name Edit Modal
function showEditNameModal() {
  const modal = document.getElementById('editNameModal');
  const input = document.getElementById('editNameInput');
  const saveBtn = document.getElementById('saveNameBtn');
  const cancelBtn = document.getElementById('cancelNameBtn');
  
  input.value = currentUser?.name || '';
  input.focus();
  
  const handleSave = () => {
    const newName = input.value.trim();
    if (!newName) {
      markInputError(input, 'Name cannot be empty');
      return;
    }
    
    currentUser.name = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateHeaderWithUserInfo();
    
    modal.close();
    showNotification('Name updated successfully', 'success');
    
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleCancel = () => {
    modal.close();
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  
  modal.showModal();
}

// Check if user is logged in
function checkAuth() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) {
    showNotification('Please log in first', 'error', 'Authentication Required');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
  try {
    currentUser = JSON.parse(userData);
    // Always update header with latest info from localStorage
    updateHeaderWithUserInfo();
    return true;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('currentUser');
    showNotification('Session expired. Please log in again.', 'error', 'Authentication Error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
}

function updateHeaderWithUserInfo() {
  // Always get latest currentUser from localStorage
  const userData = localStorage.getItem('currentUser');
  if (!userData) return;
  currentUser = JSON.parse(userData);

  const storeNameTitle = document.getElementById('storeNameTitle');
  if (storeNameTitle) storeNameTitle.textContent = currentUser.storeName || 'Store Name';

  const profileImage = document.getElementById('profileImage');
  const profileImageLarge = document.getElementById('profileImageLarge');
  const profileName = document.getElementById('profileName');

  const imgSrc = currentUser.profileImage || 'assets/profile.png';
  if (profileImage) profileImage.src = imgSrc;
  if (profileImageLarge) profileImageLarge.src = imgSrc;
  if (profileName) profileName.textContent = currentUser.name || 'User';
}

// Language Management Functions
async function loadLanguage(lang) {
  try {
    console.log('Loading language:', lang);
    const response = await fetch(`${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang}.json`);
    }
    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem('currentLanguage', lang);
    console.log('Language loaded successfully:', translations);
    
    // Wait a bit for DOM to be ready, then apply translations
    setTimeout(() => {
      applyTranslations();
    }, 100);
  } catch (error) {
    console.error('Failed to load language file:', error);
    // Fallback to English if language file fails to load
    if (lang !== 'en') {
      console.log('Falling back to English');
      await loadLanguage('en');
    }
  }
}

function applyTranslations() {
  console.log('Applying translations for language:', currentLanguage);
  console.log('Available translations:', translations);
  
  // Apply translations to all translatable elements
  const elements = {
    // App title
    'storeNameTitle': document.getElementById('storeNameTitle'),
    
    // Search
    'search': document.getElementById('search'),
    
    // Footer buttons
    'addItem': document.getElementById('addItem'),
    'quickReport': document.getElementById('quickReport'),
    'sell': document.getElementById('sell'),
    
    // Modal titles and content
    'confirmationTitle': document.getElementById('confirmationTitle'),
    'confirmationMessage': document.getElementById('confirmationMessage'),
    'confirmYes': document.getElementById('confirmYes'),
    'confirmNo': document.getElementById('confirmNo'),
    
    // Success modal
    'successMessage': document.getElementById('successMessage'),
    'successClose': document.getElementById('successClose'),
    
    // Edit name modal
    'editNameInput': document.getElementById('editNameInput'),
    'saveNameBtn': document.getElementById('saveNameBtn'),
    'cancelNameBtn': document.getElementById('cancelNameBtn'),
    
    // Sale confirmation modal
    'confirmationTotal': document.getElementById('confirmationTotal'),
    
    // Settings dropdown items
    'inventorySettingsItem': document.querySelector('[data-settings="inventory"]'),
    'accountsSettingsItem': document.querySelector('[data-settings="accounts"]'),
    'detailedSettingsItem': document.querySelector('[data-settings="detailed"]'),
    'languageSettingsItem': document.querySelector('[data-settings="language"]'),
    'contactSettingsItem': document.querySelector('[data-settings="contact"]'),
    'aboutSettingsItem': document.querySelector('[data-settings="about"]'),
    
    // Language settings page
    'languageSettingsTitle': document.getElementById('languageSettingsTitle'),
    'currentLanguageTitle': document.getElementById('currentLanguageTitle'),
    'selectLanguageTitle': document.getElementById('selectLanguageTitle'),
    'currentLanguageDisplay': document.getElementById('currentLanguageDisplay'),
    'languageSaveBtn': document.getElementById('languageSaveBtn'),
    'englishOption': document.getElementById('englishOption'),
    'amharicOption': document.getElementById('amharicOption'),
    
    // Sale confirmation modal
    'saleConfirmationTitle': document.getElementById('saleConfirmationTitle'),
    'totalPriceLabel': document.getElementById('totalPriceLabel')
  };
  
  // Apply translations if elements exist
  if (elements.storeNameTitle) {
    const storeName = getTranslation('app.storeName');
    if (storeName) {
      elements.storeNameTitle.textContent = storeName;
      console.log('Updated store name to:', storeName);
    }
  }
  
  if (elements.search) {
    const placeholder = getTranslation('search.placeholder');
    if (placeholder) {
      elements.search.placeholder = placeholder;
      console.log('Updated search placeholder to:', placeholder);
    }
  }
  
  if (elements.addItem) {
    const addItemText = getTranslation('footer.addItem');
    if (addItemText) {
      elements.addItem.textContent = addItemText;
      console.log('Updated add item button to:', addItemText);
    }
  }
  
  if (elements.quickReport) {
    const quickReportText = getTranslation('footer.quickReport');
    if (quickReportText) {
      elements.quickReport.textContent = quickReportText;
      console.log('Updated quick report button to:', quickReportText);
    }
  }
  
  if (elements.sell) {
    const sellText = getTranslation('footer.sellItems');
    if (sellText) {
      elements.sell.textContent = sellText;
      console.log('Updated sell button to:', sellText);
    }
  }
  
  if (elements.confirmationTitle) {
    const title = getTranslation('modals.confirmation.title');
    if (title) {
      elements.confirmationTitle.textContent = title;
    }
  }
  
  if (elements.confirmationMessage) {
    const message = getTranslation('modals.confirmation.message');
    if (message) {
      elements.confirmationMessage.textContent = message;
    }
  }
  
  if (elements.confirmYes) {
    const yesText = getTranslation('modals.confirmation.yes');
    if (yesText) {
      elements.confirmYes.textContent = yesText;
    }
  }
  
  if (elements.confirmNo) {
    const noText = getTranslation('modals.confirmation.no');
    if (noText) {
      elements.confirmNo.textContent = noText;
    }
  }
  
  if (elements.successMessage) {
    const successMessage = getTranslation('modals.success.message');
    if (successMessage) {
      elements.successMessage.textContent = successMessage;
    }
  }
  
  if (elements.successClose) {
    const closeText = getTranslation('modals.success.ok');
    if (closeText) {
      elements.successClose.textContent = closeText;
    }
  }
  
  if (elements.editNameInput) {
    const placeholder = getTranslation('modals.editName.placeholder');
    if (placeholder) {
      elements.editNameInput.placeholder = placeholder;
    }
  }
  
  if (elements.saveNameBtn) {
    const saveText = getTranslation('modals.editName.save');
    if (saveText) {
      elements.saveNameBtn.textContent = saveText;
    }
  }
  
  if (elements.cancelNameBtn) {
    const cancelText = getTranslation('modals.editName.cancel');
    if (cancelText) {
      elements.cancelNameBtn.textContent = cancelText;
    }
  }
  
  // Settings dropdown items
  if (elements.inventorySettingsItem) {
    const title = getTranslation('settings.inventory.title');
    if (title) {
      elements.inventorySettingsItem.textContent = title;
    }
  }
  
  if (elements.accountsSettingsItem) {
    const title = getTranslation('settings.accounts.title');
    if (title) {
      elements.accountsSettingsItem.textContent = title;
    }
  }
  
  if (elements.detailedSettingsItem) {
    const title = getTranslation('settings.detailed.title');
    if (title) {
      elements.detailedSettingsItem.textContent = title;
    }
  }
  
  if (elements.languageSettingsItem) {
    const title = getTranslation('settings.language.title');
    if (title) {
      elements.languageSettingsItem.textContent = title;
    }
  }
  
  if (elements.contactSettingsItem) {
    const title = getTranslation('settings.contact.title');
    if (title) {
      elements.contactSettingsItem.textContent = title;
    }
  }
  
  if (elements.aboutSettingsItem) {
    const title = getTranslation('settings.about.title');
    if (title) {
      elements.aboutSettingsItem.textContent = title;
    }
  }
  
  // Language settings page
  if (elements.languageSettingsTitle) {
    const title = getTranslation('settings.language.title');
    if (title) {
      elements.languageSettingsTitle.textContent = title;
    }
  }
  
  if (elements.currentLanguageTitle) {
    const title = getTranslation('settings.language.currentLanguage');
    if (title) {
      elements.currentLanguageTitle.textContent = title;
    }
  }
  
  if (elements.selectLanguageTitle) {
    const title = getTranslation('settings.language.selectLanguage');
    if (title) {
      elements.selectLanguageTitle.textContent = title;
    }
  }
  
  if (elements.currentLanguageDisplay) {
    const languageText = getTranslation(`settings.language.languages.${currentLanguage}`);
    if (languageText) {
      elements.currentLanguageDisplay.textContent = languageText;
    }
  }
  
  if (elements.languageSaveBtn) {
    const saveText = getTranslation('settings.language.save');
    if (saveText) {
      elements.languageSaveBtn.textContent = saveText;
    }
  }
  
  if (elements.englishOption) {
    const englishText = getTranslation('settings.language.languages.en');
    if (englishText) {
      elements.englishOption.textContent = englishText;
    }
  }
  
  if (elements.amharicOption) {
    const amharicText = getTranslation('settings.language.languages.am');
    if (amharicText) {
      elements.amharicOption.textContent = amharicText;
    }
  }
  
  // Sale confirmation modal
  if (elements.saleConfirmationTitle) {
    const title = getTranslation('modals.saleConfirmation.title');
    if (title) {
      elements.saleConfirmationTitle.textContent = title;
    }
  }
  
  if (elements.totalPriceLabel) {
    const totalText = getTranslation('modals.saleConfirmation.totalPrice');
    const currency = getTranslation('modals.saleConfirmation.currency');
    if (totalText && currency) {
      elements.totalPriceLabel.innerHTML = `${totalText} <span id="confirmationTotal">0</span> ${currency}`;
    }
  }
  
  // Update document title
  const appTitle = getTranslation('app.title');
  if (appTitle) {
    document.title = appTitle;
  }
}

function getTranslation(key) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }
  
  return value;
}

async function changeLanguage(newLang) {
  console.log('Changing language from', currentLanguage, 'to', newLang);
  if (newLang !== currentLanguage) {
    await loadLanguage(newLang);
    
    // Update the language selector to reflect the change
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
      languageSelector.value = newLang;
    }
    
    // Update the current language display
    const currentLanguageDisplay = document.getElementById('currentLanguageDisplay');
    if (currentLanguageDisplay) {
      const languageText = getTranslation(`settings.language.languages.${newLang}`);
      if (languageText) {
        currentLanguageDisplay.textContent = languageText;
      }
    }
    
    console.log('Language changed successfully to:', newLang);
  }
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

// Success Message Modal
function showSuccess(message) {
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

// Input Validation Functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEthiopianPhone(phone) {
  // Ethiopian phone format: +251XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)
  const phoneRegex = /^(\+251|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function markInputError(input, message = '') {
  input.classList.add('input-error');
  
  // Remove existing error message
  const existingError = input.parentNode.querySelector('.input-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add new error message if provided
  if (message) {
    const errorEl = document.createElement('span');
    errorEl.className = 'input-error-message';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }
}

function clearInputError(input) {
  input.classList.remove('input-error');
  const errorEl = input.parentNode.querySelector('.input-error-message');
  if (errorEl) {
    errorEl.remove();
  }
}

// Profile Name Edit Modal
function showEditNameModal() {
  const modal = document.getElementById('editNameModal');
  const input = document.getElementById('editNameInput');
  const saveBtn = document.getElementById('saveNameBtn');
  const cancelBtn = document.getElementById('cancelNameBtn');
  
  input.value = currentUser?.name || '';
  input.focus();
  
  const handleSave = () => {
    const newName = input.value.trim();
    if (!newName) {
      markInputError(input, 'Name cannot be empty');
      return;
    }
    
    currentUser.name = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateHeaderWithUserInfo();
    
    modal.close();
    showNotification('Name updated successfully', 'success');
    
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleCancel = () => {
    modal.close();
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  
  modal.showModal();
}

// Check if user is logged in
function checkAuth() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) {
    showNotification('Please log in first', 'error', 'Authentication Required');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
  try {
    currentUser = JSON.parse(userData);
    // Always update header with latest info from localStorage
    updateHeaderWithUserInfo();
    return true;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('currentUser');
    showNotification('Session expired. Please log in again.', 'error', 'Authentication Error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
}

function updateHeaderWithUserInfo() {
  // Always get latest currentUser from localStorage
  const userData = localStorage.getItem('currentUser');
  if (!userData) return;
  currentUser = JSON.parse(userData);

  const storeNameTitle = document.getElementById('storeNameTitle');
  if (storeNameTitle) storeNameTitle.textContent = currentUser.storeName || 'Store Name';

  const profileImage = document.getElementById('profileImage');
  const profileImageLarge = document.getElementById('profileImageLarge');
  const profileName = document.getElementById('profileName');

  const imgSrc = currentUser.profileImage || 'assets/profile.png';
  if (profileImage) profileImage.src = imgSrc;
  if (profileImageLarge) profileImageLarge.src = imgSrc;
  if (profileName) profileName.textContent = currentUser.name || 'User';
}

// When updating account info (store name, username, store type), always update localStorage and UI
async function handleSettingChange(input, label) {
  const newValue = input.value.trim();

  if (!newValue) {
    showNotification('Please enter a value', 'error', 'Validation Error');
    return;
  }

  if (input.id === 'newStoreName') {
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your store name?');
    if (confirmed) {
      currentUser.storeName = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('storeName', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Store name updated successfully!', 'success');
    }
  } else if (input.id === 'newStoreType') {
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your store type?');
    if (confirmed) {
      currentUser.storeType = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('storeType', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Store type updated successfully!', 'success');
    }
  } else if (input.id === 'editNameInput') {
    // For username change
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your username?');
    if (confirmed) {
      currentUser.name = newValue;
      localStorage.setItem('currentUser', JSON.stringify(currentUser)); // <-- Save to localStorage
      updateUserFieldInUserDB('name', newValue);
      updateHeaderWithUserInfo(); // <-- Update UI
      showNotification('Username updated successfully!', 'success');
    }
  }
  input.value = '';
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

// Success Message Modal
function showSuccess(message) {
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

// Input Validation Functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEthiopianPhone(phone) {
  // Ethiopian phone format: +251XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)
  const phoneRegex = /^(\+251|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function markInputError(input, message = '') {
  input.classList.add('input-error');
  
  // Remove existing error message
  const existingError = input.parentNode.querySelector('.input-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add new error message if provided
  if (message) {
    const errorEl = document.createElement('span');
    errorEl.className = 'input-error-message';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }
}

function clearInputError(input) {
  input.classList.remove('input-error');
  const errorEl = input.parentNode.querySelector('.input-error-message');
  if (errorEl) {
    errorEl.remove();
  }
}

// Profile Name Edit Modal
function showEditNameModal() {
  const modal = document.getElementById('editNameModal');
  const input = document.getElementById('editNameInput');
  const saveBtn = document.getElementById('saveNameBtn');
  const cancelBtn = document.getElementById('cancelNameBtn');
  
  input.value = currentUser?.name || '';
  input.focus();
  
  const handleSave = () => {
    const newName = input.value.trim();
    if (!newName) {
      markInputError(input, 'Name cannot be empty');
      return;
    }
    
    currentUser.name = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateHeaderWithUserInfo();
    
    modal.close();
    showNotification('Name updated successfully', 'success');
    
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleCancel = () => {
    modal.close();
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  
  modal.showModal();
}

// Check if user is logged in
function checkAuth() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) {
    showNotification('Please log in first', 'error', 'Authentication Required');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
  try {
    currentUser = JSON.parse(userData);
    // Always update header with latest info from localStorage
    updateHeaderWithUserInfo();
    return true;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('currentUser');
    showNotification('Session expired. Please log in again.', 'error', 'Authentication Error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
}

function updateHeaderWithUserInfo() {
  // Always get latest currentUser from localStorage
  const userData = localStorage.getItem('currentUser');
  if (!userData) return;
  currentUser = JSON.parse(userData);

  const storeNameTitle = document.getElementById('storeNameTitle');
  if (storeNameTitle) storeNameTitle.textContent = currentUser.storeName || 'Store Name';

  const profileImage = document.getElementById('profileImage');
  const profileImageLarge = document.getElementById('profileImageLarge');
  const profileName = document.getElementById('profileName');

  const imgSrc = currentUser.profileImage || 'assets/profile.png';
  if (profileImage) profileImage.src = imgSrc;
  if (profileImageLarge) profileImageLarge.src = imgSrc;
  if (profileName) profileName.textContent = currentUser.name || 'User';
}

// Language Management Functions
async function loadLanguage(lang) {
  try {
    console.log('Loading language:', lang);
    const response = await fetch(`${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang}.json`);
    }
    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem('currentLanguage', lang);
    console.log('Language loaded successfully:', translations);
    
    // Wait a bit for DOM to be ready, then apply translations
    setTimeout(() => {
      applyTranslations();
    }, 100);
  } catch (error) {
    console.error('Failed to load language file:', error);
    // Fallback to English if language file fails to load
    if (lang !== 'en') {
      console.log('Falling back to English');
      await loadLanguage('en');
    }
  }
}

function applyTranslations() {
  console.log('Applying translations for language:', currentLanguage);
  console.log('Available translations:', translations);
  
  // Apply translations to all translatable elements
  const elements = {
    // App title
    'storeNameTitle': document.getElementById('storeNameTitle'),
    
    // Search
    'search': document.getElementById('search'),
    
    // Footer buttons
    'addItem': document.getElementById('addItem'),
    'quickReport': document.getElementById('quickReport'),
    'sell': document.getElementById('sell'),
    
    // Modal titles and content
    'confirmationTitle': document.getElementById('confirmationTitle'),
    'confirmationMessage': document.getElementById('confirmationMessage'),
    'confirmYes': document.getElementById('confirmYes'),
    'confirmNo': document.getElementById('confirmNo'),
    
    // Success modal
    'successMessage': document.getElementById('successMessage'),
    'successClose': document.getElementById('successClose'),
    
    // Edit name modal
    'editNameInput': document.getElementById('editNameInput'),
    'saveNameBtn': document.getElementById('saveNameBtn'),
    'cancelNameBtn': document.getElementById('cancelNameBtn'),
    
    // Sale confirmation modal
    'confirmationTotal': document.getElementById('confirmationTotal'),
    
    // Settings dropdown items
    'inventorySettingsItem': document.querySelector('[data-settings="inventory"]'),
    'accountsSettingsItem': document.querySelector('[data-settings="accounts"]'),
    'detailedSettingsItem': document.querySelector('[data-settings="detailed"]'),
    'languageSettingsItem': document.querySelector('[data-settings="language"]'),
    'contactSettingsItem': document.querySelector('[data-settings="contact"]'),
    'aboutSettingsItem': document.querySelector('[data-settings="about"]'),
    
    // Language settings page
    'languageSettingsTitle': document.getElementById('languageSettingsTitle'),
    'currentLanguageTitle': document.getElementById('currentLanguageTitle'),
    'selectLanguageTitle': document.getElementById('selectLanguageTitle'),
    'currentLanguageDisplay': document.getElementById('currentLanguageDisplay'),
    'languageSaveBtn': document.getElementById('languageSaveBtn'),
    'englishOption': document.getElementById('englishOption'),
    'amharicOption': document.getElementById('amharicOption'),
    
    // Sale confirmation modal
    'saleConfirmationTitle': document.getElementById('saleConfirmationTitle'),
    'totalPriceLabel': document.getElementById('totalPriceLabel')
  };
  
  // Apply translations if elements exist
  if (elements.storeNameTitle) {
    const storeName = getTranslation('app.storeName');
    if (storeName) {
      elements.storeNameTitle.textContent = storeName;
      console.log('Updated store name to:', storeName);
    }
  }
  
  if (elements.search) {
    const placeholder = getTranslation('search.placeholder');
    if (placeholder) {
      elements.search.placeholder = placeholder;
      console.log('Updated search placeholder to:', placeholder);
    }
  }
  
  if (elements.addItem) {
    const addItemText = getTranslation('footer.addItem');
    if (addItemText) {
      elements.addItem.textContent = addItemText;
      console.log('Updated add item button to:', addItemText);
    }
  }
  
  if (elements.quickReport) {
    const quickReportText = getTranslation('footer.quickReport');
    if (quickReportText) {
      elements.quickReport.textContent = quickReportText;
      console.log('Updated quick report button to:', quickReportText);
    }
  }
  
  if (elements.sell) {
    const sellText = getTranslation('footer.sellItems');
    if (sellText) {
      elements.sell.textContent = sellText;
      console.log('Updated sell button to:', sellText);
    }
  }
  
  if (elements.confirmationTitle) {
    const title = getTranslation('modals.confirmation.title');
    if (title) {
      elements.confirmationTitle.textContent = title;
    }
  }
  
  if (elements.confirmationMessage) {
    const message = getTranslation('modals.confirmation.message');
    if (message) {
      elements.confirmationMessage.textContent = message;
    }
  }
  
  if (elements.confirmYes) {
    const yesText = getTranslation('modals.confirmation.yes');
    if (yesText) {
      elements.confirmYes.textContent = yesText;
    }
  }
  
  if (elements.confirmNo) {
    const noText = getTranslation('modals.confirmation.no');
    if (noText) {
      elements.confirmNo.textContent = noText;
    }
  }
  
  if (elements.successMessage) {
    const successMessage = getTranslation('modals.success.message');
    if (successMessage) {
      elements.successMessage.textContent = successMessage;
    }
  }
  
  if (elements.successClose) {
    const closeText = getTranslation('modals.success.ok');
    if (closeText) {
      elements.successClose.textContent = closeText;
    }
  }
  
  if (elements.editNameInput) {
    const placeholder = getTranslation('modals.editName.placeholder');
    if (placeholder) {
      elements.editNameInput.placeholder = placeholder;
    }
  }
  
  if (elements.saveNameBtn) {
    const saveText = getTranslation('modals.editName.save');
    if (saveText) {
      elements.saveNameBtn.textContent = saveText;
    }
  }
  
  if (elements.cancelNameBtn) {
    const cancelText = getTranslation('modals.editName.cancel');
    if (cancelText) {
      elements.cancelNameBtn.textContent = cancelText;
    }
  }
  
  // Settings dropdown items
  if (elements.inventorySettingsItem) {
    const title = getTranslation('settings.inventory.title');
    if (title) {
      elements.inventorySettingsItem.textContent = title;
    }
  }
  
  if (elements.accountsSettingsItem) {
    const title = getTranslation('settings.accounts.title');
    if (title) {
      elements.accountsSettingsItem.textContent = title;
    }
  }
  
  if (elements.detailedSettingsItem) {
    const title = getTranslation('settings.detailed.title');
    if (title) {
      elements.detailedSettingsItem.textContent = title;
    }
  }
  
  if (elements.languageSettingsItem) {
    const title = getTranslation('settings.language.title');
    if (title) {
      elements.languageSettingsItem.textContent = title;
    }
  }
  
  if (elements.contactSettingsItem) {
    const title = getTranslation('settings.contact.title');
    if (title) {
      elements.contactSettingsItem.textContent = title;
    }
  }
  
  if (elements.aboutSettingsItem) {
    const title = getTranslation('settings.about.title');
    if (title) {
      elements.aboutSettingsItem.textContent = title;
    }
  }
  
  // Language settings page
  if (elements.languageSettingsTitle) {
    const title = getTranslation('settings.language.title');
    if (title) {
      elements.languageSettingsTitle.textContent = title;
    }
  }
  
  if (elements.currentLanguageTitle) {
    const title = getTranslation('settings.language.currentLanguage');
    if (title) {
      elements.currentLanguageTitle.textContent = title;
    }
  }
  
  if (elements.selectLanguageTitle) {
    const title = getTranslation('settings.language.selectLanguage');
    if (title) {
      elements.selectLanguageTitle.textContent = title;
    }
  }
  
  if (elements.currentLanguageDisplay) {
    const languageText = getTranslation(`settings.language.languages.${currentLanguage}`);
    if (languageText) {
      elements.currentLanguageDisplay.textContent = languageText;
    }
  }
  
  if (elements.languageSaveBtn) {
    const saveText = getTranslation('settings.language.save');
    if (saveText) {
      elements.languageSaveBtn.textContent = saveText;
    }
  }
  
  if (elements.englishOption) {
    const englishText = getTranslation('settings.language.languages.en');
    if (englishText) {
      elements.englishOption.textContent = englishText;
    }
  }
  
  if (elements.amharicOption) {
    const amharicText = getTranslation('settings.language.languages.am');
    if (amharicText) {
      elements.amharicOption.textContent = amharicText;
    }
  }
  
  // Sale confirmation modal
  if (elements.saleConfirmationTitle) {
    const title = getTranslation('modals.saleConfirmation.title');
    if (title) {
      elements.saleConfirmationTitle.textContent = title;
    }
  }
  
  if (elements.totalPriceLabel) {
    const totalText = getTranslation('modals.saleConfirmation.totalPrice');
    const currency = getTranslation('modals.saleConfirmation.currency');
    if (totalText && currency) {
      elements.totalPriceLabel.innerHTML = `${totalText} <span id="confirmationTotal">0</span> ${currency}`;
    }
  }
  
  // Update document title
  const appTitle = getTranslation('app.title');
  if (appTitle) {
    document.title = appTitle;
  }
}

function getTranslation(key) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }
  
  return value;
}

async function changeLanguage(newLang) {
  console.log('Changing language from', currentLanguage, 'to', newLang);
  if (newLang !== currentLanguage) {
    await loadLanguage(newLang);
    
    // Update the language selector to reflect the change
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
      languageSelector.value = newLang;
    }
    
    // Update the current language display
    const currentLanguageDisplay = document.getElementById('currentLanguageDisplay');
    if (currentLanguageDisplay) {
      const languageText = getTranslation(`settings.language.languages.${newLang}`);
      if (languageText) {
        currentLanguageDisplay.textContent = languageText;
      }
    }
    
    console.log('Language changed successfully to:', newLang);
  }
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

// Success Message Modal
function showSuccess(message) {
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

// Input Validation Functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEthiopianPhone(phone) {
  // Ethiopian phone format: +251XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)
  const phoneRegex = /^(\+251|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function markInputError(input, message = '') {
  input.classList.add('input-error');
  
  // Remove existing error message
  const existingError = input.parentNode.querySelector('.input-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add new error message if provided
  if (message) {
    const errorEl = document.createElement('span');
    errorEl.className = 'input-error-message';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }
}

function clearInputError(input) {
  input.classList.remove('input-error');
  const errorEl = input.parentNode.querySelector('.input-error-message');
  if (errorEl) {
    errorEl.remove();
  }
}

// Profile Name Edit Modal
function showEditNameModal() {
  const modal = document.getElementById('editNameModal');
  const input = document.getElementById('editNameInput');
  const saveBtn = document.getElementById('saveNameBtn');
  const cancelBtn = document.getElementById('cancelNameBtn');
  
  input.value = currentUser?.name || '';
  input.focus();
  
  const handleSave = () => {
    const newName = input.value.trim();
    if (!newName) {
      markInputError(input, 'Name cannot be empty');
      return;
    }
    
    currentUser.name = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateHeaderWithUserInfo();
    
    modal.close();
    showNotification('Name updated successfully', 'success');
    
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleCancel = () => {
    modal.close();
    // Cleanup
    saveBtn.removeEventListener('click', handleSave);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  
  modal.showModal();
}

// Check if user is logged in
function checkAuth() {
  const userData = localStorage.getItem('currentUser');
  if (!userData) {
    showNotification('Please log in first', 'error', 'Authentication Required');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
  try {
    currentUser = JSON.parse(userData);
    // Always update header with latest info from localStorage
    updateHeaderWithUserInfo();
    return true;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('currentUser');
    showNotification('Session expired. Please log in again.', 'error', 'Authentication Error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return false;
  }
}

function updateHeaderWithUserInfo() {
  // Always get latest currentUser from localStorage
  const userData = localStorage.getItem('currentUser');
  if (!userData) return;
  currentUser = JSON.parse(userData);

  const storeNameTitle = document.getElementById('storeNameTitle');
  if (storeNameTitle) storeNameTitle.textContent = currentUser.storeName || 'Store Name';

  const profileImage = document.getElementById('profileImage');
  const profileImageLarge = document.getElementById('profileImageLarge');
  const profileName = document.getElementById('profileName');

  const imgSrc = currentUser.profileImage || 'assets/profile.png';
  if (profileImage) profileImage.src = imgSrc;
  if (profileImageLarge) profileImageLarge.src = imgSrc;
  if (profileName) profileName.textContent = currentUser.name || 'User';
}

// Language Management Functions
async function loadLanguage(lang) {
  try {
    console.log('Loading language:', lang);
    const response = await fetch(`${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang}.json`);
    }
    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem('currentLanguage', lang);
    console.log('Language loaded successfully:', translations);
    
    // Wait a bit for DOM to be ready, then apply translations
    setTimeout(() => {
      applyTranslations();
    }, 100);
  } catch (error) {
    console.error('Failed to load language file:', error);
    // Fallback to English if language file fails to load
    if (lang !== 'en') {
      console.log('Falling back to English');
      await loadLanguage('en');
    }
  }
}

function applyTranslations() {
  console.log('Applying translations for language:', currentLanguage);
  console.log('Available translations:', translations);
  
  // Apply translations to all translatable elements
  const elements = {
    // App title
    'storeNameTitle': document.getElementById('storeNameTitle'),
    
    // Search
    'search': document.getElementById('search'),
    
    // Footer buttons
    'addItem': document.getElementById('addItem'),
    'quickReport': document.getElementById('quickReport'),
    'sell': document.getElementById('sell'),
    
    // Modal titles and content
    'confirmationTitle': document.getElementById('confirmationTitle'),
    'confirmationMessage': document.getElementById('confirmationMessage'),
    'confirmYes': document.getElementById('confirmYes'),
    'confirmNo': document.getElementById('confirmNo'),
    
    // Success modal
    'successMessage': document.getElementById('successMessage'),
    'successClose': document.getElementById('successClose'),
    
    // Edit name modal
    'editNameInput': document.getElementById('editNameInput'),
    'saveNameBtn': document.getElementById('saveNameBtn'),
    'cancelNameBtn': document.getElementById('cancelNameBtn'),
    
    // Sale confirmation modal
    'confirmationTotal': document.getElementById('confirmationTotal'),
    
    // Settings dropdown items
    'inventorySettingsItem': document.querySelector('[data-settings="inventory"]'),
    'accountsSettingsItem': document.querySelector('[data-settings="accounts"]'),
    'detailedSettingsItem': document.querySelector('[data-settings="detailed"]'),
    'languageSettingsItem': document.querySelector('[data-settings="language"]'),
    'contactSettingsItem': document.querySelector('[data-settings="contact"]'),
    'aboutSettingsItem': document.querySelector('[data-settings="about"]'),
    
    // Language settings page
    'languageSettingsTitle': document.getElementById('languageSettingsTitle'),
    'currentLanguageTitle': document.getElementById('currentLanguageTitle'),
    'selectLanguageTitle': document.getElementById('selectLanguageTitle'),
    'currentLanguageDisplay': document.getElementById('currentLanguageDisplay'),
    'languageSaveBtn': document.getElementById('languageSaveBtn'),
    'englishOption': document.getElementById('englishOption'),
    'amharicOption': document.getElementById('amharicOption'),
    
    // Sale confirmation modal
    'saleConfirmationTitle': document.getElementById('saleConfirmationTitle'),
    'totalPriceLabel': document.getElementById('totalPriceLabel')
  };
  
  // Apply translations if elements exist
  if (elements.storeNameTitle) {
    const storeName = getTranslation('app.storeName');
    if (storeName) {
      elements.storeNameTitle.textContent = storeName;
      console.log('Updated store name to:', storeName);
    }
  }
  
  if (elements.search) {
    const placeholder = getTranslation('search.placeholder');
    if (placeholder) {
      elements.search.placeholder = placeholder;
      console.log('Updated search placeholder to:', placeholder);
    }
  }
  
  if (elements.addItem) {
    const addItemText = getTranslation('footer.addItem');
    if (addItemText) {
      elements.addItem.textContent = addItemText;
      console.log('Updated add item button to:', addItemText);
    }
  }
  
  if (elements.quickReport) {
    const quickReportText = getTranslation('footer.quickReport');
    if (quickReportText) {
      elements.quickReport.textContent = quickReportText;
      console.log('Updated quick report button to:', quickReportText);
    }
  }
  
  if (elements.sell) {
    const sellText = getTranslation('footer.sellItems');
    if (sellText) {
      elements.sell.textContent = sellText;
      console.log('Updated sell button to:', sellText);
    }
  }
  
  if (elements.confirmationTitle) {
    const title = getTranslation('modals.confirmation.title');
    if (title) {
      elements.confirmationTitle.textContent = title;
    }
  }
  
  if (elements.confirmationMessage) {
    const message = getTranslation('modals.confirmation.message');
    if (message) {
      elements.confirmationMessage.textContent = message;
    }
  }
  
  if (elements.confirmYes) {
    const yesText = getTranslation('modals.confirmation.yes');
    if (yesText) {
      elements.confirmYes.textContent = yesText;
    }
  }
  
  if (elements.confirmNo) {
    const noText = getTranslation('modals.confirmation.no');
    if (noText) {
      elements.confirmNo.textContent = noText;
    }
  }
  
  if (elements.successMessage) {
    const successMessage = getTranslation('modals.success.message');
    if (successMessage) {
      elements.successMessage.textContent = successMessage;
    }
  }
  
  if (elements.successClose) {
    const closeText = getTranslation('modals.success.ok');
    if (closeText) {
      elements.successClose.textContent = closeText;
    }
  }
  
  if (elements.editNameInput) {
    const placeholder = getTranslation('modals.editName.placeholder');
    if (placeholder) {
      elements.editNameInput.placeholder = placeholder;
    }
  }
  
  if (elements.saveNameBtn) {
    const saveText = getTranslation('modals.editName.save');
    if (saveText) {
      elements.saveNameBtn.textContent = saveText;
    }
  }
  
  if (elements.cancelNameBtn) {
    const cancelText = getTranslation('modals.editName.cancel');
    if (cancelText) {
      elements.cancelNameBtn.textContent = cancelText;
    }
  }
  
  // Settings dropdown items
  if (elements.inventorySettingsItem) {
    const title = getTranslation('settings.inventory.title');
    if (title) {
      elements.inventorySettingsItem.textContent = title;
    }
  }
  
  if (elements.accountsSettingsItem) {
    const title = getTranslation('settings.accounts.title');
    if (title) {
      elements.accountsSettingsItem.textContent = title;
    }
  }
  
  if (elements.detailedSettingsItem) {
    const title = getTranslation('settings.detailed.title');
    if (title) {
      elements.detailedSettingsItem.textContent = title;
    }
  }
  
  if (elements.languageSettingsItem) {
    const title = getTranslation('settings.language.title');
    if (title) {
      elements.languageSettingsItem.textContent = title;
    }
  }
  
  if (elements.contactSettingsItem) {
    const title = getTranslation('settings.contact.title');
    if (title) {
      elements.contactSettingsItem.textContent = title;
    }
  }
  
  if (elements.aboutSettingsItem) {
    const title = getTranslation('settings.about.title');
    if (title) {
      elements.aboutSettingsItem.textContent = title;
    }
  }
  
  // Language settings page
  if (elements.languageSettingsTitle) {
    const title = getTranslation('settings.language.title');
    if (title) {
      elements.languageSettingsTitle.textContent = title;
    }
  }
  
  if (elements.currentLanguageTitle) {
    const title = getTranslation('settings.language.currentLanguage');
    if (title) {
      elements.currentLanguageTitle.textContent = title;
    }
  }
  
  if (elements.selectLanguageTitle) {
    const title = getTranslation('settings.language.selectLanguage');
    if (title) {
      elements.selectLanguageTitle.textContent = title;
    }
  }
  
  if (elements.currentLanguageDisplay) {
    const languageText = getTranslation(`settings.language.languages.${currentLanguage}`);
    if (languageText) {
      elements.currentLanguageDisplay.textContent = languageText;
    }
  }
  
  if (elements.languageSaveBtn) {
    const saveText = getTranslation('settings.language.save');
    if (saveText) {
      elements.languageSaveBtn.textContent = saveText;
    }
  }
  
  if (elements.englishOption) {
    const englishText = getTranslation('settings.language.languages.en');
    if (englishText) {
      elements.englishOption.textContent = englishText;
    }
  }
  
  if (elements.amharicOption) {
    const amharicText = getTranslation('settings.language.languages.am');
    if (amharicText) {
      elements.amharicOption.textContent = amharicText;
    }
  }
  
  // Sale confirmation modal
  if (elements.saleConfirmationTitle) {
    const title = getTranslation('modals.saleConfirmation.title');
    if (title) {
      elements.saleConfirmationTitle.textContent = title;
    }
  }
  
  if (elements.totalPriceLabel) {
    const totalText = getTranslation('modals.saleConfirmation.totalPrice');
    const currency = getTranslation('modals.saleConfirmation.currency');
    if (totalText && currency) {
      elements.totalPriceLabel.innerHTML = `${totalText} <span id="confirmationTotal">0</span> ${currency}`;
    }
  }
  
  // Update document title
  const appTitle = getTranslation('app.title');
  if (appTitle) {
    document.title = appTitle;
  }
}

// Update document title
const appTitle = getTranslation('app.title');
if (appTitle) {
  document.title = appTitle;
}

// Database functions for user data persistence
let userDB;

function initUserDB() {
  if (!('indexedDB' in window)) return;
  const request = indexedDB.open('UserDB', 1);
  request.onupgradeneeded = (event) => {
    userDB = event.target.result;
    if (!userDB.objectStoreNames.contains('users')) {
      userDB.createObjectStore('users', { keyPath: 'id' });
    }
  };
  request.onsuccess = (event) => {
    userDB = event.target.result;
    console.log('UserDB initialized successfully');
  };
  request.onerror = (event) => {
    console.error('UserDB IndexedDB error:', event.target.error);
  };
}

function saveUserToDB(userData) {
  if (!userDB) return;
  
  const transaction = userDB.transaction(['users'], 'readwrite');
  const store = transaction.objectStore('users');
  const request = store.put(userData);
  
  request.onsuccess = () => {
    console.log('User saved to IndexedDB:', userData);
  };
  
  request.onerror = (event) => {
    console.error('Error saving user to IndexedDB:', event.target.error);
  };
}

function updateUserFieldInUserDB(field, value) {
  if (!currentUser) {
    console.error('No current user found');
    return;
  }
  
  // Update the current user object
  currentUser[field] = value;
  
  // Save to localStorage
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  // Save to IndexedDB if available
  if (userDB) {
    saveUserToDB(currentUser);
  }
  
  console.log(`Updated ${field} to ${value} in database`);
}

function getUserFromDB(emailPhone) {
  return new Promise((resolve, reject) => {
    if (!userDB) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = userDB.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      const users = event.target.result;
      const user = users.find(u => u.emailPhone === emailPhone);
      resolve(user);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing inventory application...');
  
  // Initialize the user database
  initUserDB();
  
  // Check authentication
  if (!checkAuth()) {
    return;
  }
  
  // Load saved language preference
  const savedLanguage = localStorage.getItem('currentLanguage') || 'en';
  await loadLanguage(savedLanguage);
  
  // Update header with user info
  updateHeaderWithUserInfo();
  
  // Initialize other components
  initializeInventorySystem();
  
  console.log('Inventory application initialized successfully');
});

// Initialize inventory system components
function initializeInventorySystem() {
  // Initialize Firebase database
  db = firebase.firestore();
  
  // Restore user data from database if needed
  restoreUserDataFromDB();
  
  // Load inventory data
  loadInventory();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load any saved settings
  loadSavedSettings();
}

// Restore user data from database if localStorage is empty
async function restoreUserDataFromDB() {
  if (!currentUser || !currentUser.emailPhone) {
    console.log('No current user data found, attempting to restore from database...');
    return;
  }
  
  try {
    const userFromDB = await getUserFromDB(currentUser.emailPhone);
    if (userFromDB && (!currentUser.name || !currentUser.storeName || !currentUser.storeType)) {
      // Update missing fields from database
      currentUser.name = currentUser.name || userFromDB.name;
      currentUser.storeName = currentUser.storeName || userFromDB.storeName;
      currentUser.storeType = currentUser.storeType || userFromDB.storeType;
      
      // Save updated user data
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateHeaderWithUserInfo();
      
      console.log('User data restored from database:', currentUser);
    }
  } catch (error) {
    console.error('Error restoring user data from database:', error);
  }
}

// Load saved settings from localStorage
function loadSavedSettings() {
  // Load any other saved preferences here
  const savedSettings = localStorage.getItem('inventorySettings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      // Apply saved settings
      console.log('Loaded saved settings:', settings);
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  }
}

// Setup event listeners for the inventory system
function setupEventListeners() {
  // Add event listeners for buttons, forms, etc.
  const addItemBtn = document.getElementById('addItem');
  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      // Handle add item functionality
      console.log('Add item button clicked');
    });
  }
  
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      // Handle search functionality
      console.log('Search input:', e.target.value);
    });
  }
  
  // Add more event listeners as needed
}

// Load inventory data from Firebase
function loadInventory() {
  if (!db || !currentUser) return;
  
  db.collection('users').doc(currentUser.id).collection('inventory')
    .onSnapshot((snapshot) => {
      inventory = [];
      snapshot.forEach((doc) => {
        inventory.push({ id: doc.id, ...doc.data() });
      });
      displayInventory();
    }, (error) => {
      console.error('Error loading inventory:', error);
    });
}

// Display inventory items
function displayInventory() {
  const inventoryContainer = document.getElementById('inventoryContainer');
  if (!inventoryContainer) return;
  
  // Clear existing items
  inventoryContainer.innerHTML = '';
  
  // Display each inventory item
  inventory.forEach(item => {
    const itemElement = createInventoryItemElement(item);
    inventoryContainer.appendChild(itemElement);
  });
}

// Create inventory item element
function createInventoryItemElement(item) {
  const div = document.createElement('div');
  div.className = 'inventory-item';
  div.innerHTML = `
    <h3>${item.name || 'Unnamed Item'}</h3>
    <p>Quantity: ${item.quantity || 0}</p>
    <p>Price: ${item.price || 0}</p>
  `;
  return div;
}
