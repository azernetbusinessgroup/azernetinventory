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
  if (!currentUser) return;
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

function toggleProfileDropdown() {
  const dropdown = document.getElementById('profileDropdown');
  const btn = document.getElementById('profileBtn');
  if (!dropdown || !btn) return;
  const isHidden = dropdown.classList.toggle('hidden');
  btn.setAttribute('aria-expanded', String(!isHidden));
}

async function showUserProfile() {
  if (!currentUser) return;
  
  const profileInfo = `
    Store: ${currentUser.storeName || 'N/A'}
    Type: ${currentUser.storeType || 'N/A'}
    Owner: ${currentUser.name || 'N/A'}
    Email/Phone: ${currentUser.emailPhone || 'N/A'}
  `;
  
  const confirmed = await showConfirmation('Profile Information', `${profileInfo}\n\nDo you want to logout?`);
  if (confirmed) {
    logout();
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

function initDB() {
  if (!('indexedDB' in window) || !currentUser) return;
  
  const dbName = `InventoryDB_${currentUser.id}`;
  const request = indexedDB.open(dbName, 2);
  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('items')) {
      db.createObjectStore('items', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('profile')) {
      db.createObjectStore('profile', { keyPath: 'key' });
    }
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    loadInventory();
    loadProfileFromDB();
  };
  request.onerror = (event) => {
    console.error('IndexedDB error:', event.target.error);
  };
}

function loadInventory() {
  if (!db) return;
  
  const transaction = db.transaction(['items'], 'readonly');
  const store = transaction.objectStore('items');
  const request = store.getAll();
  
  request.onsuccess = (event) => {
    inventory = event.target.result || [];
    renderInventory();
  };
  
  request.onerror = (event) => {
    console.error('Error loading inventory:', event.target.error);
    inventory = [];
    renderInventory();
  };
}

function saveInventory() {
  if (!db) return;
  
  const transaction = db.transaction(['items'], 'readwrite');
  const store = transaction.objectStore('items');
  
  // Clear existing items and add current ones
  store.clear();
  inventory.forEach(item => store.put(item));
}

function loadProfileFromDB() {
  if (!db) return;
  const transaction = db.transaction(['profile'], 'readonly');
  const store = transaction.objectStore('profile');
  const request = store.get('profileImage');
  request.onsuccess = (event) => {
    const record = event.target.result;
    if (record && record.value) {
      currentUser.profileImage = record.value;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateHeaderWithUserInfo();
    }
  };
}

function saveProfileImageToDB(dataUrl) {
  if (!db) return;
  const transaction = db.transaction(['profile'], 'readwrite');
  const store = transaction.objectStore('profile');
  store.put({ key: 'profileImage', value: dataUrl });
}

function updateUserFieldInUserDB(field, value) {
  if (!currentUser || !('indexedDB' in window)) return;
  const request = indexedDB.open('UserDB', 1);
  request.onsuccess = (event) => {
    const userDB = event.target.result;
    const tx = userDB.transaction(['users'], 'readwrite');
    const store = tx.objectStore('users');
    const getReq = store.get(currentUser.id);
    getReq.onsuccess = () => {
      const user = getReq.result;
      if (user) {
        user[field] = value;
        store.put(user);
      }
    };
  };
}

function addItem(name, type, purchasePrice, quantityType, quantityValue, amountInPack, sellingPrice, description, image, paymentStatus) {
  const id = String(inventory.length + 1).padStart(3, '0');
  const item = { 
    id, 
    name, 
    type, 
    purchasePrice, 
    quantityType, 
    quantityValue, 
    amountInPack, 
    sellingPrice, 
    description, 
    image: image || '',
    paymentStatus: paymentStatus || 'paid',
    userId: currentUser.id, // Add user ID to track ownership
    createdAt: new Date().toISOString()
  };
  inventory.push(item);
  saveInventory();
  renderInventory();
}

function renderInventory() {
  const inventoryList = document.getElementById('inventoryList');
  inventoryList.innerHTML = '';
  
  if (inventory.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.padding = '40px';
    emptyMessage.style.color = '#666';
    emptyMessage.innerHTML = `
      <h3>No items in inventory yet</h3>
      <p>Click "Add Item" to start building your inventory</p>
    `;
    inventoryList.appendChild(emptyMessage);
    return;
  }
  
  const settings = getEffectiveSettings();
  inventory.forEach(item => {
    const row = document.createElement('div');
    row.className = 'item-row';

    if (isSelectionMode) {
      row.classList.add('selectable');
      row.innerHTML = `
        <input type="checkbox" class="select-checkbox" ${selectedItemIds.includes(item.id) ? 'checked' : ''} />
        <img class="item-thumb" src="${item.image || 'assets/images/placeholder.png'}" alt="${item.name}">
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-stock">Stock: ${formatStock(item)}</div>
        </div>
      `;
      row.addEventListener('click', (e) => {
        if (e.target && e.target.matches('.select-checkbox')) {
          toggleItemSelection(item.id);
        } else {
          toggleItemSelection(item.id);
        }
      });
      if (selectedItemIds.includes(item.id)) row.classList.add('selected');
    } else {
      row.innerHTML = `
        <img class="item-thumb" src="${item.image || 'assets/images/placeholder.png'}" alt="${item.name}">
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          ${buildInventoryMetaLine(item, settings)}
        </div>
      `;
      row.addEventListener('click', () => openItemDetail(item.id));
    }
    inventoryList.appendChild(row);
  });
}

function formatStock(item) {
  const qty = Number.isFinite(item.quantityValue) ? item.quantityValue : 0;
  const unit = item.quantityType || 'pcs';
  return `${qty} ${unit}`;
}

function buildInventoryMetaLine(item, settings) {
  const parts = [];
  if (settings.inventory.showAmountUnits) {
    const totalPieces = (Number(item.quantityValue) || 0) * (Number(item.amountInPack) || 0);
    parts.push(`Units: ${totalPieces} pcs`);
  }
  if (settings.inventory.showAmountPacks) {
    parts.push(`Packs: ${Number(item.quantityValue) || 0}`);
  }
  if (settings.inventory.showPurchasePrice) {
    parts.push(`Buy: ${Math.round(Number(item.purchasePrice || 0))} ETB`);
  }
  if (settings.inventory.showSellingPrice && item.sellingPrice) {
    parts.push(`Sell: ${Math.round(Number(item.sellingPrice || 0))} ETB`);
  }
  if (parts.length === 0) {
    return `<div class="item-stock">Stock: ${formatStock(item)}</div>`;
  }
  return `<div class="item-stock">${parts.join(' | ')}</div>`;
}

function openItemDetail(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;
  
  if (isSelectionMode) {
    toggleItemSelection(id);
    return;
  }

  const modal = document.getElementById('itemDetailModal');
  const content = document.getElementById('itemDetailContent');
  const editIcon = document.getElementById('detailEditIcon');
  currentDetailItemId = id;
  
  content.innerHTML = `
    <img class="item-detail-image" src="${item.image || 'assets/images/placeholder.png'}" alt="${item.name}">
    
    <div class="item-detail-info">
      <p><strong>${item.name}</strong></p>
      <p>ID: ${item.id}</p>
      <p>Type: ${item.type}</p>
      <p>Purchase Price: ${item.purchasePrice} ETB (${item.paymentStatus || 'paid'})</p>
      <p>Quantity in Packs: ${item.quantityValue}</p>
      <p>Total Quantity: ${item.quantityValue * item.amountInPack} pcs</p>
      <p>Pieces per Pack: ${item.amountInPack}</p>
      ${item.sellingPrice ? `<p>Selling Price: ${item.sellingPrice} ETB</p>` : ''}
      ${item.description ? `<p>Description: ${item.description}</p>` : ''}
    </div>
    
    <div class="item-detail-actions">
      <button onclick="showAddForm('${item.id}')">Add</button>
      <button onclick="deleteItem('${item.id}')">Delete</button>
      <button onclick="showSellForm('${item.id}')">Sell</button>
    </div>
    
    <div id="sellForm_${item.id}" class="sell-form" style="display: none;">
      <div class="sell-form-row">
        <input type="number" id="sellAmount_${item.id}" placeholder="Amount" min="1" max="${item.quantityValue * item.amountInPack}">
        <select id="sellUnit_${item.id}">
          <option value="pcs">Pcs</option>
          <option value="packs">Packs</option>
        </select>
        <input type="number" id="sellPrice_${item.id}" placeholder="Unit Price" value="${item.sellingPrice || ''}">
        <select id="sellStatus_${item.id}" class="status-select">
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>
      <div class="sell-form-row">
        <input type="text" id="customerName_${item.id}" placeholder="Customer Name">
        <button onclick="processSale('${item.id}')">Sell</button>
      </div>
    </div>

    <div id="addForm_${item.id}" class="sell-form" style="display: none;">
      <div class="sell-form-row">
        <input type="number" id="addPurchasePrice_${item.id}" placeholder="Purchase Price" value="${item.purchasePrice || ''}">
        <select id="addPaymentStatus_${item.id}" class="status-select">
          <option value="paid" ${item.paymentStatus === 'paid' ? 'selected' : ''}>Paid</option>
          <option value="unpaid" ${item.paymentStatus === 'unpaid' ? 'selected' : ''}>Unpaid</option>
        </select>
      </div>
      <div class="sell-form-row">
        <input type="number" id="addAmount_${item.id}" placeholder="Amount" min="1">
        <select id="addUnit_${item.id}">
          <option value="pcs">Pcs</option>
          <option value="packs">Packs</option>
        </select>
        <button onclick="processAdd('${item.id}')">Save</button>
      </div>
    </div>
  `;
  if (editIcon) {
    editIcon.onclick = () => editItem(id);
  }
  
  modal.showModal();
}

function showSellForm(itemId) {
  const sellForm = document.getElementById(`sellForm_${itemId}`);
  if (sellForm) {
    sellForm.style.display = sellForm.style.display === 'none' ? 'block' : 'none';
  }
}

function showAddForm(itemId) {
  const addForm = document.getElementById(`addForm_${itemId}`);
  if (addForm) {
    addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
  }
}

function processAdd(itemId) {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return;
  const priceEl = document.getElementById(`addPurchasePrice_${itemId}`);
  const statusEl = document.getElementById(`addPaymentStatus_${itemId}`);
  const amountEl = document.getElementById(`addAmount_${itemId}`);
  const unitEl = document.getElementById(`addUnit_${itemId}`);
  const price = parseFloat(priceEl?.value || '');
  const amount = parseInt(amountEl?.value || '');
  const unit = unitEl?.value || 'pcs';
  if (!price || !amount) { 
    showNotification('Please enter purchase price and amount', 'error', 'Validation Error'); 
    return; 
  }
  // Update item fields
  item.purchasePrice = price;
  item.paymentStatus = statusEl ? statusEl.value : 'paid';
  // Compute new stock
  const addPieces = unit === 'packs' ? amount * item.amountInPack : amount;
  const currentPieces = (Number(item.quantityValue)||0) * (Number(item.amountInPack)||0);
  const newPieces = currentPieces + addPieces;
  item.quantityValue = Math.ceil(newPieces / (Number(item.amountInPack)||1));
  saveInventory();
  renderInventory();
  document.getElementById('itemDetailModal').close();
}

function processSale(itemId) {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return;
  
  const amount = parseInt(document.getElementById(`sellAmount_${itemId}`).value);
  const unit = document.getElementById(`sellUnit_${itemId}`).value;
  const price = parseFloat(document.getElementById(`sellPrice_${itemId}`).value);
  const customerName = document.getElementById(`customerName_${itemId}`).value;
  const statusEl = document.getElementById(`sellStatus_${itemId}`);
  const paymentStatus = statusEl ? statusEl.value : 'paid';
  
  if (!amount || !price || !customerName.trim()) {
    showNotification('Please fill in all fields', 'error', 'Validation Error');
    return;
  }
  
  // Calculate actual pieces being sold
  let piecesSold = amount;
  if (unit === 'packs') {
    piecesSold = amount * item.amountInPack;
  }
  
  // Check if we have enough stock
  const totalPieces = item.quantityValue * item.amountInPack;
  if (piecesSold > totalPieces) {
    showNotification('Not enough stock available', 'error', 'Stock Error');
    return;
  }
  
  // Update inventory
  const remainingPieces = totalPieces - piecesSold;
  const remainingPacks = Math.ceil(remainingPieces / item.amountInPack);
  
  item.quantityValue = remainingPacks;
  
  // Save and refresh
  saveInventory();
  renderInventory();
  
  // Close modal
  document.getElementById('itemDetailModal').close();
  
  // Record sale (basic local record per day)
  recordSale({ itemId: item.id, name: item.name, piecesSold, unitPrice: price, total: piecesSold * price, customerName, paymentStatus });

  // Show unified sale confirmation modal
  showUnifiedSaleConfirmation([{ item, piecesSold, price, customerName }]);
}

function editItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;
  
  // Close detail modal
  document.getElementById('itemDetailModal').close();
  
  // Set edit mode
  isEditMode = true;
  currentEditItemId = id;
  
  // Open add item modal with pre-filled data
  const addItemModal = document.getElementById('addItemModal');
  const addItemForm = document.getElementById('addItemForm');
  const imagePlaceholder = document.getElementById('imagePlaceholder');
  
  // Pre-fill form fields
  addItemForm.querySelector('[name="name"]').value = item.name;
  addItemForm.querySelector('[name="type"]').value = item.type;
  addItemForm.querySelector('[name="purchasePrice"]').value = item.purchasePrice;
  addItemForm.querySelector('[name="paymentStatus"]').value = item.paymentStatus || 'paid';
  addItemForm.querySelector('[name="quantityValue"]').value = item.quantityValue;
  addItemForm.querySelector('[name="quantityType"]').value = item.quantityType || 'packs';
  addItemForm.querySelector('[name="amountInPack"]').value = item.amountInPack;
  addItemForm.querySelector('[name="sellingPrice"]').value = item.sellingPrice || '';
  addItemForm.querySelector('[name="description"]').value = item.description || '';
  
  // Set image if exists
  if (item.image) {
    imagePlaceholder.src = item.image;
  } else {
    imagePlaceholder.src = 'assets/placeholder.png';
  }
  
  // Change modal title
  const modalTitle = addItemModal.querySelector('h2') || document.createElement('h2');
  modalTitle.textContent = 'Edit Item';
  modalTitle.style.color = 'white';
  modalTitle.style.textAlign = 'center';
  modalTitle.style.margin = '0 0 16px 0';
  
  if (!addItemModal.querySelector('h2')) {
    addItemModal.insertBefore(modalTitle, addItemModal.firstChild);
  }
  
  addItemModal.showModal();
}

function updateExistingItem(id, form) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;
  
  const quantityType = form.querySelector('[name="quantityType"]').value;
  const quantityValue = parseInt(form.querySelector('[name="quantityValue"]').value);
  const paymentStatus = form.querySelector('[name="paymentStatus"]').value;
  const image = document.getElementById('imagePlaceholder').src.includes('placeholder') ? '' : document.getElementById('imagePlaceholder').src;
  
  // Update item properties
  item.name = form.name.value;
  item.type = form.type.value;
  item.purchasePrice = parseFloat(form.purchasePrice.value);
  item.quantityType = quantityType;
  item.quantityValue = quantityValue;
  item.amountInPack = parseInt(form.amountInPack.value);
  item.sellingPrice = parseFloat(form.sellingPrice.value) || null;
  item.description = form.description.value;
  item.image = image;
  item.paymentStatus = paymentStatus;
  
  // Save and refresh
  saveInventory();
  renderInventory();
  
  // Close modal and reset form
  document.getElementById('addItemModal').close();
  form.reset();
  document.getElementById('imagePlaceholder').src = 'assets/placeholder.png';
  
  // Remove edit title
  const editTitle = document.getElementById('addItemModal').querySelector('h2');
  if (editTitle) editTitle.remove();
  
  // Reset edit mode
  isEditMode = false;
  currentEditItemId = null;
}

async function deleteItem(id) {
  const confirmed = await showConfirmation('Delete Item', 'Are you sure you want to delete this item?');
  if (confirmed) {
    inventory = inventory.filter(i => i.id !== id);
    saveInventory();
    renderInventory();
    showNotification('Item deleted successfully', 'success');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication first
  if (!checkAuth()) return;
  
  const addItemBtn = document.getElementById('addItem');
  const addItemModal = document.getElementById('addItemModal');
  const addItemForm = document.getElementById('addItemForm');
  const closeIcon = document.querySelector('.close-icon');
  const imagePlaceholder = document.getElementById('imagePlaceholder');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileBtn = document.getElementById('profileBtn');
  let profileImageInput = null; // will be created dynamically
  const editProfileBtn = document.getElementById('editProfileBtn');
  const editNameBtn = document.getElementById('editNameBtn');
  const searchInput = document.getElementById('search');
  const filterIcon = document.querySelector('.filter-icon');
  const filterMenu = document.getElementById('filterMenu');
  const sellBtn = document.getElementById('sell');
  const quickReportBtn = document.getElementById('quickReport');
  const quickReportModal = document.getElementById('quickReportModal');
  const quickReportClose = document.getElementById('quickReportClose');
  const sellItemsModal = document.getElementById('sellItemsModal');
  const sellItemsContent = document.getElementById('sellItemsContent');
  const sellPrev = document.getElementById('sellPrev');
  const sellNext = document.getElementById('sellNext');
  const sellCounter = document.getElementById('sellCounter');

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      filterInventory(searchTerm);
    });
  }

  // Filter icon functionality
  if (filterIcon && filterMenu) {
    filterIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      buildAndToggleFilterMenu(filterMenu);
    });
    document.addEventListener('click', () => filterMenu.classList.add('hidden'));
  }

  addItemBtn.addEventListener('click', () => {
    // Reset edit mode
    isEditMode = false;
    currentEditItemId = null;
    
    addItemModal.showModal();
    imagePlaceholder.src = 'assets/placeholder.png'; // Reset image on modal open
    
    // Remove any existing edit title
    const editTitle = addItemModal.querySelector('h2');
    if (editTitle) editTitle.remove();
  });

  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    
    if (isEditMode && currentEditItemId) {
      // Handle edit mode
      updateExistingItem(currentEditItemId, form);
    } else {
      // Handle add mode
      const quantityType = form.querySelector('[name="quantityType"]').value;
      const quantityValue = parseInt(form.querySelector('[name="quantityValue"]').value);
      const paymentStatus = form.querySelector('[name="paymentStatus"]').value;
      const image = imagePlaceholder.src.includes('placeholder') ? '' : imagePlaceholder.src;
      addItem(
        form.name.value,
        form.type.value,
        parseFloat(form.purchasePrice.value),
        quantityType,
        quantityValue,
        parseInt(form.amountInPack.value),
        parseFloat(form.sellingPrice.value),
        form.description.value,
        image,
        paymentStatus
      );
      form.reset();
      imagePlaceholder.src = 'assets/placeholder.png'; // Reset image after submission
      addItemModal.close();
    }
  });

  closeIcon.addEventListener('click', () => {
    addItemModal.close();
    imagePlaceholder.src = 'assets/placeholder.png'; // Reset image on close
    // Reset edit mode
    isEditMode = false;
    currentEditItemId = null;
    // Remove edit title
    const editTitle = addItemModal.querySelector('h2');
    if (editTitle) editTitle.remove();
  });

  // Detail modal close
  const detailClose = document.querySelector('.detail-close');
  const itemDetailModal = document.getElementById('itemDetailModal');
  if (detailClose && itemDetailModal) {
    detailClose.addEventListener('click', () => itemDetailModal.close());
  }

  imagePlaceholder.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePlaceholder.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  });

  // Logout button event listener
  logoutBtn.addEventListener('click', logout);

  // Profile dropdown toggle
  if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleProfileDropdown();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profileDropdown');
    const btn = document.getElementById('profileBtn');
    if (!dropdown || !btn) return;
    const isClickInside = dropdown.contains(e.target) || btn.contains(e.target);
    if (!isClickInside && !dropdown.classList.contains('hidden')) {
      toggleProfileDropdown();
    }
  });

  // Edit profile picture
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      // Create file input on demand
      if (!profileImageInput) {
        profileImageInput = document.createElement('input');
        profileImageInput.type = 'file';
        profileImageInput.accept = 'image/*';
        profileImageInput.style.display = 'none';
        document.body.appendChild(profileImageInput);
        profileImageInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target.result;
            currentUser.profileImage = dataUrl;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateHeaderWithUserInfo();
            saveProfileImageToDB(dataUrl);
            updateUserFieldInUserDB('profileImage', dataUrl);
          };
          reader.readAsDataURL(file);
        });
      }
      profileImageInput.click();
    });
  }

  // Edit name
  if (editNameBtn) {
    editNameBtn.addEventListener('click', () => {
      showEditNameModal();
    });
  }

  // Initialize DB and header on load
  initDB();
  updateHeaderWithUserInfo();
  loadSettings(); // Load saved settings

  // Hide/reveal header and search on scroll
  initHideOnScroll();

  // Sell button toggles selection and multi-sell flow
  if (sellBtn) {
    sellBtn.addEventListener('click', handleSellButtonClick);
  }

  // Multi-sell nav
  if (sellPrev && sellNext) {
    sellPrev.addEventListener('click', () => navigateSell(-1));
    sellNext.addEventListener('click', () => navigateSell(1));
  }

  // Multi-sell modal close
  const sellItemsClose = document.getElementById('sellItemsClose');
  if (sellItemsClose) {
    sellItemsClose.addEventListener('click', () => {
      document.getElementById('sellItemsModal').close();
      // Keep selection mode and selected items intact per requirement
    });
  }

  // Sale confirmation modal close
  const saleConfirmationClose = document.getElementById('saleConfirmationClose');
  if (saleConfirmationClose) {
    saleConfirmationClose.addEventListener('click', () => {
      document.getElementById('saleConfirmationModal').close();
    });
  }

  // Full screen table back button
  const tableBackBtn = document.getElementById('tableBackBtn');
  if (tableBackBtn) {
    tableBackBtn.addEventListener('click', () => {
      const fullScreenTable = document.getElementById('fullScreenTable');
      if (fullScreenTable) fullScreenTable.classList.add('hidden');
      
      // Reopen the quick report modal
      const quickReportModal = document.getElementById('quickReportModal');
      if (quickReportModal) quickReportModal.showModal();
    });
  }

  // Settings dropdown functionality
  const settingsIcon = document.querySelector('.settings-icon');
  const settingsDropdown = document.getElementById('settingsDropdown');
  
  if (settingsIcon && settingsDropdown) {
    settingsIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!settingsIcon.contains(e.target) && !settingsDropdown.contains(e.target)) {
        settingsDropdown.classList.add('hidden');
      }
    });
    
    // Handle settings menu item clicks
    const settingsItems = settingsDropdown.querySelectorAll('.dropdown-item');
    settingsItems.forEach(item => {
      item.addEventListener('click', () => {
        const settingsType = item.getAttribute('data-settings');
        openSettingsPage(settingsType);
        settingsDropdown.classList.add('hidden');
      });
    });
  }

  // Settings back buttons
  const settingsBackBtns = document.querySelectorAll('.settings-back-btn');
  settingsBackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllSettingsPages();
    });
  });

  // Save buttons functionality
  const saveBtns = document.querySelectorAll('.save-btn');
  saveBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      saveSettings(e.target);
    });
  });

  // Change buttons functionality
  const changeBtns = document.querySelectorAll('.change-btn');
  changeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const settingItem = e.target.closest('.setting-item');
      const input = settingItem.querySelector('input');
      const label = settingItem.querySelector('label');
      
      if (input && label) {
        handleSettingChange(input, label);
      }
    });
  });



  // Quick report
  if (quickReportBtn && quickReportModal) {
    quickReportBtn.addEventListener('click', openQuickReport);
    if (quickReportClose) quickReportClose.addEventListener('click', () => quickReportModal.close());
  }

  // Global sell button
  const sellAllBtn = document.getElementById('sellAllBtn');
  if (sellAllBtn) {
    sellAllBtn.addEventListener('click', processAllSales);
  }
});

function filterInventory(searchTerm) {
  if (!searchTerm) {
    renderInventory();
    return;
  }
  
  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    item.type.toLowerCase().includes(searchTerm) ||
    item.id.toLowerCase().includes(searchTerm)
  );
  
  renderFilteredInventory(filteredItems);
}

function renderFilteredInventory(filteredItems) {
  const inventoryList = document.getElementById('inventoryList');
  inventoryList.innerHTML = '';
  
  if (filteredItems.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.padding = '40px';
    emptyMessage.style.color = '#666';
    emptyMessage.innerHTML = `
      <h3>No items found</h3>
      <p>Try adjusting your search terms</p>
    `;
    inventoryList.appendChild(emptyMessage);
    return;
  }
  
  const settings = getEffectiveSettings();
  filteredItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'item-row';
    
    if (isSelectionMode) {
      row.classList.add('selectable');
      row.innerHTML = `
        <input type="checkbox" class="select-checkbox" ${selectedItemIds.includes(item.id) ? 'checked' : ''} />
        <img class="item-thumb" src="${item.image || 'assets/images/placeholder.png'}" alt="${item.name}">
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-stock">Stock: ${formatStock(item)}</div>
        </div>
      `;
      row.addEventListener('click', (e) => {
        if (e.target && e.target.matches('.select-checkbox')) {
          toggleItemSelection(item.id);
        } else {
          toggleItemSelection(item.id);
        }
      });
      if (selectedItemIds.includes(item.id)) row.classList.add('selected');
    } else {
      row.innerHTML = `
        <img class=\"item-thumb\" src=\"${item.image || 'assets/images/placeholder.png'}\" alt=\"${item.name}\">\n        <div class=\"item-info\">\n          <div class=\"item-name\">${item.name}</div>\n          ${buildInventoryMetaLine(item, settings)}\n        </div>\n      `;
      row.addEventListener('click', () => openItemDetail(item.id));
    }
    inventoryList.appendChild(row);
  });
}

// Expose functions for global use
window.editItem = editItem;
window.deleteItem = deleteItem;
window.showSellForm = showSellForm;
window.processSale = processSale;
window.updateExistingItem = updateExistingItem;
window.showAddForm = showAddForm;
window.processAdd = processAdd;

// ---------- New helpers and features ----------

function buildAndToggleFilterMenu(menuEl) {
  if (!menuEl) return;
  const uniqueTypes = Array.from(new Set(inventory.map(i => (i.type || '').trim()).filter(Boolean)));
  const items = ['All', ...uniqueTypes];
  menuEl.innerHTML = items.map(type => `<div class="filter-option" data-type="${type}">${type || 'Unknown'}</div>`).join('');
  menuEl.classList.toggle('hidden');
  menuEl.querySelectorAll('.filter-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = opt.getAttribute('data-type');
      if (type === 'All') {
        renderInventory();
      } else {
        const filtered = inventory.filter(i => (i.type || '').trim() === type);
        renderFilteredInventory(filtered);
      }
      menuEl.classList.add('hidden');
    });
  });
}

function initHideOnScroll() {
  let lastScroll = window.pageYOffset || document.documentElement.scrollTop;
  const header = document.querySelector('header');
  const searchBar = document.querySelector('.search-container');
  window.addEventListener('scroll', () => {
    const current = window.pageYOffset || document.documentElement.scrollTop;
    const isDown = current > lastScroll;
    if (isDown) {
      header && header.classList.add('header-hidden');
      searchBar && searchBar.classList.add('search-hidden');
    } else {
      header && header.classList.remove('header-hidden');
      searchBar && searchBar.classList.remove('search-hidden');
    }
    lastScroll = current <= 0 ? 0 : current;
  }, { passive: true });
}

function handleSellButtonClick(e) {
  if (!isSelectionMode) {
    // Enter selection mode
    isSelectionMode = true;
    selectedItemIds = [];
    e.target.textContent = 'Proceed';
    renderInventory();
  } else if (isSelectionMode && selectedItemIds.length > 0) {
    // Open multi-sell modal
    currentSellIndex = 0;
    openMultiSellModal();
  } else {
    // No selection, exit selection mode
    isSelectionMode = false;
    selectedItemIds = [];
    e.target.textContent = 'Sell Items';
    renderInventory();
  }
}

function toggleItemSelection(itemId) {
  const idx = selectedItemIds.indexOf(itemId);
  if (idx >= 0) selectedItemIds.splice(idx, 1); else selectedItemIds.push(itemId);
  renderInventory();
}

function openMultiSellModal() {
  const modal = document.getElementById('sellItemsModal');
  if (!modal) return;
  
  // Reset multi-sell data and customer name
  multiSellData = {};
  globalCustomerName = '';
  currentSellIndex = 0;
  
  updateSellModalContent();
  modal.showModal();
}

function updateSellModalContent() {
  const sellItemsContent = document.getElementById('sellItemsContent');
  const sellCounter = document.getElementById('sellCounter');
  const items = selectedItemIds.map(id => inventory.find(i => i.id === id)).filter(Boolean);
  if (items.length === 0) return;
  
  const item = items[currentSellIndex];
  sellCounter.textContent = `${currentSellIndex + 1} / ${items.length}`;
  
  // Get saved data for this item
  const savedData = multiSellData[item.id] || {};
  
  sellItemsContent.innerHTML = `
    <img class="item-detail-image" src="${item.image || 'assets/images/placeholder.png'}" alt="${item.name}">
    <div class="item-detail-info">
      <p><strong>${item.name}</strong></p>
      <p>ID: ${item.id}</p>
      <p>Type: ${item.type}</p>
      <p>Stock: ${formatStock(item)}</p>
    </div>
    <div class="sell-form">
      <div class="sell-form-row">
        <input type="number" id="ms_amount" placeholder="Amount" min="1" max="${item.quantityValue * item.amountInPack}" value="${savedData.amount || ''}">
        <select id="ms_unit">
          <option value="pcs" ${(savedData.unit || 'pcs') === 'pcs' ? 'selected' : ''}>Pcs</option>
          <option value="packs" ${(savedData.unit || 'pcs') === 'packs' ? 'selected' : ''}>Packs</option>
        </select>
        <input type="number" id="ms_price" placeholder="Unit Price" value="${savedData.price || item.sellingPrice || ''}">
        <select id="ms_status" class="status-select">
          <option value="paid" ${(savedData.paymentStatus || 'paid') === 'paid' ? 'selected' : ''}>Paid</option>
          <option value="unpaid" ${(savedData.paymentStatus || 'paid') === 'unpaid' ? 'selected' : ''}>Unpaid</option>
        </select>
      </div>
      <div class="sell-form-row">
        <input type="text" id="ms_customer" placeholder="Customer Name" value="${globalCustomerName}">
      </div>
    </div>
  `;
  
  // Add event listeners for form validation
  const amountInput = document.getElementById('ms_amount');
  const priceInput = document.getElementById('ms_price');
  const customerInput = document.getElementById('ms_customer');
  const sellAllBtn = document.getElementById('sellAllBtn');
  
  // Function to validate form and update button state
  const validateForm = () => {
    const amount = amountInput.value.trim();
    const price = priceInput.value.trim();
    const customer = customerInput.value.trim();
    
    const isValid = amount && price && customer && 
                   parseFloat(amount) > 0 && parseFloat(price) > 0;
    
    // Save form data
    multiSellData[item.id] = {
      amount: amount,
      unit: document.getElementById('ms_unit').value,
      price: price,
      paymentStatus: document.getElementById('ms_status').value
    };
    
    // Update global customer name
    if (customer) {
      globalCustomerName = customer;
    }
    updateSellAllButtonState();
  };
  
  // Add input event listeners
  amountInput.addEventListener('input', validateForm);
  priceInput.addEventListener('input', validateForm);
  customerInput.addEventListener('input', validateForm);
  
  // Initial validation
  validateForm();
  // Also update global sell-all state
  updateSellAllButtonState();
}

function navigateSell(direction) {
  const len = selectedItemIds.length;
  if (len === 0) return;
  
  // Save current form data before navigating
  const currentItem = selectedItemIds[currentSellIndex];
  if (currentItem) {
    const amountInput = document.getElementById('ms_amount');
    const priceInput = document.getElementById('ms_price');
    const customerInput = document.getElementById('ms_customer');
    
    if (amountInput && priceInput && customerInput) {
      multiSellData[currentItem] = {
        amount: amountInput.value,
        unit: document.getElementById('ms_unit').value,
        price: priceInput.value,
        paymentStatus: document.getElementById('ms_status').value
      };
      
      // Update global customer name
      if (customerInput.value.trim()) {
        globalCustomerName = customerInput.value.trim();
      }
    }
  }
  
  currentSellIndex = (currentSellIndex + direction + len) % len;
  updateSellModalContent();
}

function processMultiSale(itemId) {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return;
  
  const amount = parseInt(document.getElementById('ms_amount').value);
  const unit = document.getElementById('ms_unit').value;
  const price = parseFloat(document.getElementById('ms_price').value);
  const customerName = document.getElementById('ms_customer').value;
  const paymentStatus = document.getElementById('ms_status').value;
  
  if (!amount || !price || !customerName.trim()) { 
    showNotification('Please fill in all fields', 'error', 'Validation Error'); 
    return; 
  }
  
  let piecesSold = amount;
  if (unit === 'packs') piecesSold = amount * item.amountInPack;
  
  const totalPieces = item.quantityValue * item.amountInPack;
  if (piecesSold > totalPieces) { 
    showNotification('Not enough stock available', 'error', 'Stock Error'); 
    return; 
  }
  
  // Update inventory
  const remainingPieces = totalPieces - piecesSold;
  const remainingPacks = Math.ceil(remainingPieces / item.amountInPack);
  item.quantityValue = remainingPacks;
  
  // Save and refresh
  saveInventory();
  renderInventory();
  
  // Record sale
  recordSale({ 
    itemId: item.id, 
    name: item.name, 
    piecesSold, 
    unitPrice: price, 
    total: piecesSold * price, 
    customerName, 
    paymentStatus 
  });
  
  // Move next or finish
  if (currentSellIndex === selectedItemIds.length - 1) {
    // All items processed, show confirmation
    showSaleConfirmation();
    
    // Close modal and reset
    document.getElementById('sellItemsModal').close();
    isSelectionMode = false;
    selectedItemIds = [];
    const sellBtn = document.getElementById('sell');
    if (sellBtn) sellBtn.textContent = 'Sell Items';
  } else {
    currentSellIndex += 1;
    updateSellModalContent();
  }
}

function areAllSelectedItemsValid() {
  if (selectedItemIds.length === 0) return false;
  const customer = (document.getElementById('ms_customer')?.value || globalCustomerName || '').trim();
  if (!customer) return false;
  // Ensure each selected item has amount and price captured in multiSellData
  return selectedItemIds.every(id => {
    const d = multiSellData[id];
    return d && parseFloat(d.amount) > 0 && parseFloat(d.price) > 0;
  });
}

function updateSellAllButtonState() {
  const btn = document.getElementById('sellAllBtn');
  if (!btn) return;
  btn.disabled = !areAllSelectedItemsValid();
}

function processAllSales() {
  // Validate all forms
  if (!areAllSelectedItemsValid()) {
    showNotification('Please fill amount and price for all selected items and enter customer name.', 'error', 'Validation Error');
    return;
  }
  const customerName = (document.getElementById('ms_customer')?.value || globalCustomerName || '').trim();
  // Apply sales for each selected item
  selectedItemIds.forEach(id => {
    const item = inventory.find(i => i.id === id);
    const data = multiSellData[id];
    if (!item || !data) return;
    let piecesSold = parseInt(data.amount);
    if (data.unit === 'packs') piecesSold = parseInt(data.amount) * item.amountInPack;
    const totalPieces = item.quantityValue * item.amountInPack;
    if (piecesSold > totalPieces) {
      // Skip invalid over-sell silently or alert and abort
      return;
    }
    const remainingPieces = totalPieces - piecesSold;
    const remainingPacks = Math.ceil(remainingPieces / item.amountInPack);
    item.quantityValue = remainingPacks;
    recordSale({
      itemId: item.id,
      name: item.name,
      piecesSold,
      unitPrice: parseFloat(data.price),
      total: piecesSold * parseFloat(data.price),
      customerName,
      paymentStatus: data.paymentStatus || 'paid'
    });
  });
  saveInventory();
  renderInventory();
  // Show confirmation and then reset selection
  showUnifiedSaleConfirmation(selectedItemIds.map(id => {
    const item = inventory.find(i => i.id === id);
    const data = multiSellData[id];
    if (item && data) {
      let piecesSold = parseInt(data.amount);
      if (data.unit === 'packs') piecesSold = parseInt(data.amount) * item.amountInPack;
      return { item, piecesSold, price: parseFloat(data.price), customerName: globalCustomerName };
    }
    return null;
  }).filter(Boolean));
  document.getElementById('sellItemsModal').close();
  isSelectionMode = false;
  selectedItemIds = [];
  const sellBtn = document.getElementById('sell');
  if (sellBtn) sellBtn.textContent = 'Sell Items';
}

function recordSale(sale) {
  try {
    const key = `sales_${new Date().toISOString().slice(0,10)}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ ...sale, timestamp: Date.now() });
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to record sale', e);
  }
}

function openQuickReport() {
  const modal = document.getElementById('quickReportModal');
  if (!modal) return;
  
  const todayKey = `sales_${new Date().toISOString().slice(0,10)}`;
  const sales = JSON.parse(localStorage.getItem(todayKey) || '[]');
  
  // Get today's date for inventory items
  const today = new Date().toISOString().slice(0, 10);
  
  // Calculate Total Purchases: Purchase Price × Quantity (in pieces) for items added today
  const totalPurchases = inventory.reduce((sum, item) => {
    if (item.createdAt && item.createdAt.startsWith(today)) {
      const totalPieces = item.quantityValue * item.amountInPack;
      return sum + (item.purchasePrice * totalPieces);
    }
    return sum;
  }, 0);
  
  // Calculate Total Sales from sales records
  const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  
  // Calculate Profit: (Selling Price - Purchase Price) × Sold Quantity for all sold items
  const profit = sales.reduce((sum, sale) => {
    const item = inventory.find(i => i.id === sale.itemId);
    if (item) {
      const unitProfit = (sale.unitPrice - item.purchasePrice);
      return sum + (unitProfit * sale.piecesSold);
    }
    return sum;
  }, 0);
  
  // Calculate Payables: Sum of Unpaid Purchases × Quantity (in pieces) for items added today
  const payables = inventory.reduce((sum, item) => {
    if (item.createdAt && item.createdAt.startsWith(today) && item.paymentStatus === 'unpaid') {
      const totalPieces = item.quantityValue * item.amountInPack;
      return sum + (item.purchasePrice * totalPieces);
    }
    return sum;
  }, 0);
  
  // Calculate Receivables: Sum of Unpaid Sells × Quantity (in pieces) for all sold items
  const receivables = sales.reduce((sum, sale) => {
    if (sale.paymentStatus === 'unpaid') {
      return sum + sale.total;
    }
    return sum;
  }, 0);
  
  // Calculate total items sold
  const itemsSold = sales.reduce((sum, s) => sum + (s.piecesSold || 0), 0);
  
  // Update display elements
  const dateEl = document.getElementById('qrDate');
  const purchasesEl = document.getElementById('qrPurchases');
  const salesEl = document.getElementById('qrSales');
  const profitEl = document.getElementById('qrProfit');
  const payablesEl = document.getElementById('qrPayables');
  const receivablesEl = document.getElementById('qrReceivables');
  const itemsSoldEl = document.getElementById('qrItemsSold');
  const listEl = document.getElementById('qrList');
  const btnSold = document.getElementById('qrBtnSold');
  const btnPurchased = document.getElementById('qrBtnPurchased');
  const btnPay = document.getElementById('qrBtnPayables');
  const btnRec = document.getElementById('qrBtnReceivables');

  dateEl.textContent = new Date().toLocaleDateString();
      purchasesEl.textContent = Math.round(totalPurchases);
    salesEl.textContent = Math.round(totalSales);
    profitEl.textContent = Math.round(profit);
    payablesEl.textContent = Math.round(payables);
    receivablesEl.textContent = Math.round(receivables);
  itemsSoldEl.textContent = String(itemsSold);

  listEl.classList.add('hidden');
  const settings = getEffectiveSettings();
  btnSold.style.display = settings.quickReport.showItemsSold ? 'block' : 'none';
  if (btnPurchased) btnPurchased.style.display = settings.quickReport.showItemsPurchased ? 'block' : 'none';
  btnPay.style.display = settings.quickReport.showPayables ? 'block' : 'none';
  btnRec.style.display = settings.quickReport.showReceivables ? 'block' : 'none';

  btnSold.onclick = () => showQuickList('sold', listEl, sales);
  if (btnPurchased) btnPurchased.onclick = () => showQuickList('purchased', listEl, sales);
  btnPay.onclick = () => showQuickList('payables', listEl, sales);
  btnRec.onclick = () => showQuickList('receivables', listEl, sales);
  modal.showModal();
}

function showQuickList(type, container, sales) {
  // Hide the quick report modal
  const quickReportModal = document.getElementById('quickReportModal');
  if (quickReportModal) quickReportModal.close();
  
  // Show the full screen table
  const fullScreenTable = document.getElementById('fullScreenTable');
  const tableTitle = document.getElementById('tableTitle');
  const tableContent = document.getElementById('tableContent');
  
  if (!fullScreenTable || !tableTitle || !tableContent) return;
  
  if (type === 'sold') {
    tableTitle.textContent = 'Items Sold';
    
    // Group sales by item name and calculate totals
    const itemTotals = {};
    sales.forEach(sale => {
      if (!itemTotals[sale.name]) {
        itemTotals[sale.name] = { quantity: 0, total: 0 };
      }
      itemTotals[sale.name].quantity += sale.piecesSold;
      itemTotals[sale.name].total += sale.total;
    });
    
    const tableHtml = `
      <table class="quick-report-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Total Quantity</th>
            <th>Total Price</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(itemTotals).map(([name, data]) => `
            <tr>
              <td>${name}</td>
              <td>${data.quantity} pcs</td>
              <td>${Math.round(data.total)} ETB</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    tableContent.innerHTML = sales.length ? tableHtml : '<div class="no-data">No sales today</div>';
    
  } else if (type === 'purchased') {
    tableTitle.textContent = 'Items Purchased';
    const today = new Date().toISOString().slice(0, 10);
    const todaysItems = inventory.filter(item => item.createdAt && item.createdAt.startsWith(today));
    if (todaysItems.length > 0) {
      const tableHtml = `
        <table class="quick-report-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity (pcs)</th>
              <th>Total Purchase</th>
            </tr>
          </thead>
          <tbody>
            ${todaysItems.map(item => {
              const pcs = (Number(item.quantityValue)||0) * (Number(item.amountInPack)||0);
              const total = pcs * (Number(item.purchasePrice)||0);
              return `
                <tr>
                  <td>${item.name}</td>
                  <td>${pcs}</td>
                  <td>${Math.round(total)} ETB</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
      tableContent.innerHTML = tableHtml;
    } else {
      tableContent.innerHTML = '<div class="no-data">No purchases today</div>';
    }
  } else if (type === 'payables') {
    tableTitle.textContent = 'Payables';
    
    // Get unpaid purchases from inventory for today
    const today = new Date().toISOString().slice(0, 10);
    const unpaidPurchases = inventory.filter(item => 
      item.createdAt && item.createdAt.startsWith(today) && item.paymentStatus === 'unpaid'
    );
    
    if (unpaidPurchases.length > 0) {
      const tableHtml = `
        <table class="quick-report-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${unpaidPurchases.map(item => {
              const totalPieces = item.quantityValue * item.amountInPack;
              const amount = item.purchasePrice * totalPieces;
              return `
                <tr>
                  <td>${item.name}</td>
                  <td>${Math.round(amount)} ETB</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
      tableContent.innerHTML = tableHtml;
    } else {
      tableContent.innerHTML = '<div class="no-data">No payables today</div>';
    }
    
  } else if (type === 'receivables') {
    tableTitle.textContent = 'Receivables';
    
    // Get unpaid sales
    const unpaidSales = sales.filter(s => s.paymentStatus === 'unpaid');
    
    if (unpaidSales.length > 0) {
      // Group by customer name
      const customerTotals = {};
      unpaidSales.forEach(sale => {
        if (!customerTotals[sale.customerName]) {
          customerTotals[sale.customerName] = 0;
        }
        customerTotals[sale.customerName] += sale.total;
      });
      
      const tableHtml = `
        <table class="quick-report-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(customerTotals).map(([customer, amount]) => `
              <tr>
                <td>${customer}</td>
                <td>${Math.round(amount)} ETB</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      tableContent.innerHTML = tableHtml;
    } else {
      tableContent.innerHTML = '<div class="no-data">No receivables today</div>';
    }
  }
  
  // Show the full screen table
  fullScreenTable.classList.remove('hidden');
}

function showUnifiedSaleConfirmation(salesData) {
  const modal = document.getElementById('saleConfirmationModal');
  if (!modal) return;
  
  // Get the first customer name (all should be the same in a single sale)
  const customerName = salesData[0]?.customerName || 'Customer';
  const confirmationCustomerName = document.getElementById('confirmationCustomerName');
  const confirmationItems = document.getElementById('confirmationItems');
  const confirmationTotal = document.getElementById('confirmationTotal');
  
  // Update customer name in message
  confirmationCustomerName.textContent = customerName;
  
  // Build items list
  let totalPrice = 0;
  let itemsHtml = '';
  
  salesData.forEach((sale) => {
    const { item, piecesSold, price } = sale;
    const itemTotal = piecesSold * price;
    totalPrice += itemTotal;
    
    itemsHtml += `<div>${piecesSold} ${item.name}</div>`;
  });
  
  confirmationItems.innerHTML = itemsHtml;
  confirmationTotal.textContent = Math.round(totalPrice);
  
  modal.showModal();
}



// Settings Functions
function openSettingsPage(settingsType) {
  // Close all settings pages first
  closeAllSettingsPages();
  
  // Show the selected settings page
  const settingsPage = document.getElementById(settingsType + 'Settings');
  if (settingsPage) {
    settingsPage.classList.remove('hidden');
    
    // Pre-fill form fields with current values
    prefillSettingsForm(settingsType);
    
    // Initialize detail report if it's the detailed settings page
    if (settingsType === 'detailed') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeDetailReport();
      }, 100);
    }
  }
}

function closeAllSettingsPages() {
  const allSettingsPages = document.querySelectorAll('.settings-page');
  allSettingsPages.forEach(page => {
    page.classList.add('hidden');
  });
}

function prefillSettingsForm(settingsType) {
  if (settingsType === 'accounts') {
    // Pre-fill account information
    const newEmailPhone = document.getElementById('newEmailPhone');
    const newStoreName = document.getElementById('newStoreName');
    const newStoreType = document.getElementById('newStoreType');
    
    if (newEmailPhone && currentUser) {
      newEmailPhone.value = currentUser.emailPhone || '';
    }
    if (newStoreName && currentUser) {
      newStoreName.value = currentUser.storeName || '';
    }
    if (newStoreType && currentUser) {
      newStoreType.value = currentUser.storeType || '';
    }
    
    // Set subscription date (join date + 1 year)
    const subscriptionDate = document.getElementById('subscriptionDate');
    if (subscriptionDate && currentUser) {
      const joinDate = new Date(currentUser.createdAt || Date.now());
      const renewalDate = new Date(joinDate);
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      subscriptionDate.textContent = renewalDate.toISOString().slice(0, 10);
    }
  }
}

async function handleSettingChange(input, label) {
  const newValue = input.value.trim();
  
  if (!newValue) {
    showNotification('Please enter a value', 'error', 'Validation Error');
    return;
  }
  
  // Handle different types of changes
  if (input.id === 'newEmailPhone') {
    // Validate email/phone format
    let isValid = false;
    if (newValue.includes('@')) {
      isValid = validateEmail(newValue);
      if (!isValid) {
        markInputError(input, 'Please enter a valid email address');
        return;
      }
    } else {
      isValid = validateEthiopianPhone(newValue);
      if (!isValid) {
        markInputError(input, 'Please enter a valid Ethiopian phone number (+251XXXXXXXXX or 0XXXXXXXXX)');
        return;
      }
    }
    
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your email/phone number?');
    if (confirmed) {
      currentUser.emailPhone = newValue;
      updateUserFieldInUserDB('emailPhone', newValue);
      showNotification('Email/Phone number updated successfully!', 'success');
      clearInputError(input);
    }
  } else if (input.id === 'newPassword') {
    // Handled in saveSettings with old password validation
    return;
  } else if (input.id === 'newStoreName') {
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your store name?');
    if (confirmed) {
      currentUser.storeName = newValue;
      updateUserFieldInUserDB('storeName', newValue);
      updateHeaderWithUserInfo();
      showNotification('Store name updated successfully!', 'success');
    }
  } else if (input.id === 'newStoreType') {
    const confirmed = await showConfirmation('Confirm Change', 'Are you sure you want to change your store type?');
    if (confirmed) {
      currentUser.storeType = newValue;
      updateUserFieldInUserDB('storeType', newValue);
      showNotification('Store type updated successfully!', 'success');
    }
  }
  
  // Clear the input field
  input.value = '';
}

function saveSettings(clickedSaveBtn) {
  // Save all toggle settings to localStorage
  const settings = {
    inventory: {
      showPurchasePrice: document.getElementById('showPurchasePrice')?.checked || false,
      showSellingPrice: document.getElementById('showSellingPrice')?.checked || false,
      showAmountUnits: document.getElementById('showAmountUnits')?.checked || false,
      showAmountPacks: document.getElementById('showAmountPacks')?.checked || false
    },
    quickReport: {
      showItemsSold: document.getElementById('showItemsSold')?.checked || false,
      showItemsPurchased: document.getElementById('showItemsPurchased')?.checked || false,
      showPayables: document.getElementById('showPayables')?.checked || false,
      showReceivables: document.getElementById('showReceivables')?.checked || false
    },
    share: {
      showSellingPrice: document.getElementById('shareSellingPrice')?.checked || false,
      showDescription: document.getElementById('shareDescription')?.checked || false,
      showItemType: document.getElementById('shareItemType')?.checked || false,
      showStock: document.getElementById('shareStock')?.checked || false
    }
  };
  
  localStorage.setItem('inventorySettings', JSON.stringify(settings));
  // Handle account updates
  const newEmailPhoneEl = document.getElementById('newEmailPhone');
  const oldPasswordEl = document.getElementById('oldPassword');
  const newPasswordEl = document.getElementById('newPassword');
  const newStoreNameEl = document.getElementById('newStoreName');
  const newStoreTypeEl = document.getElementById('newStoreType');

  // Update email/phone directly if provided
  if (newEmailPhoneEl && newEmailPhoneEl.value.trim()) {
    currentUser.emailPhone = newEmailPhoneEl.value.trim();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserFieldInUserDB('emailPhone', currentUser.emailPhone);
    newEmailPhoneEl.value = '';
  }

  // Update store name/type if provided
  if (newStoreNameEl && newStoreNameEl.value.trim()) {
    currentUser.storeName = newStoreNameEl.value.trim();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserFieldInUserDB('storeName', currentUser.storeName);
    updateHeaderWithUserInfo();
    newStoreNameEl.value = '';
  }
  if (newStoreTypeEl && newStoreTypeEl.value.trim()) {
    currentUser.storeType = newStoreTypeEl.value.trim();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserFieldInUserDB('storeType', currentUser.storeType);
    newStoreTypeEl.value = '';
  }

  // Password change with validation
  if (newPasswordEl && newPasswordEl.value.trim()) {
    const newPass = newPasswordEl.value.trim();
    const oldPass = (oldPasswordEl && oldPasswordEl.value) ? oldPasswordEl.value : '';
    validateAndChangePassword(oldPass, newPass)
      .then(() => {
        // Clear fields after success
        if (oldPasswordEl) oldPasswordEl.value = '';
        newPasswordEl.value = '';
        showNotification('Settings saved successfully!', 'success');
      })
      .catch(msg => {
        if (clickedSaveBtn) {
          clickedSaveBtn.style.backgroundColor = '#d32f2f';
        }
        // Highlight old password input in red instead of showing alert
        if (oldPasswordEl) {
          markInputError(oldPasswordEl, msg || 'Old password is incorrect');
        }
      });
  } else {
    showNotification('Settings saved successfully!', 'success');
  }
}

function validateAndChangePassword(oldPassword, newPassword) {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window) || !currentUser) {
      reject('Unable to access user database.');
      return;
    }
    const request = indexedDB.open('UserDB', 1);
    request.onsuccess = (event) => {
      const userDB = event.target.result;
      const tx = userDB.transaction(['users'], 'readwrite');
      const store = tx.objectStore('users');
      const getReq = store.get(currentUser.id);
      getReq.onsuccess = () => {
        const user = getReq.result;
        if (!user) { reject('User not found.'); return; }
        if (!oldPassword || user.password !== oldPassword) {
          reject('Old password is incorrect.');
          return;
        }
        user.password = newPassword;
        store.put(user);
        resolve();
      };
      getReq.onerror = () => reject('Failed to verify user.');
    };
    request.onerror = () => reject('Failed to open user database.');
  });
}



function loadSettings() {
  try {
    const savedSettings = JSON.parse(localStorage.getItem('inventorySettings') || '{}');
    
    // Apply inventory settings
    if (savedSettings.inventory) {
      const { showPurchasePrice, showSellingPrice, showAmountUnits, showAmountPacks } = savedSettings.inventory;
      
      const purchasePriceToggle = document.getElementById('showPurchasePrice');
      const sellingPriceToggle = document.getElementById('showSellingPrice');
      const amountUnitsToggle = document.getElementById('showAmountUnits');
      const amountPacksToggle = document.getElementById('showAmountPacks');
      
      if (purchasePriceToggle) purchasePriceToggle.checked = showPurchasePrice;
      if (sellingPriceToggle) sellingPriceToggle.checked = showSellingPrice;
      if (amountUnitsToggle) amountUnitsToggle.checked = showAmountUnits;
      if (amountPacksToggle) amountPacksToggle.checked = showAmountPacks;
    } else {
      // Apply requested defaults when no saved settings exist
      const purchasePriceToggle = document.getElementById('showPurchasePrice');
      const sellingPriceToggle = document.getElementById('showSellingPrice');
      const amountUnitsToggle = document.getElementById('showAmountUnits');
      const amountPacksToggle = document.getElementById('showAmountPacks');
      if (purchasePriceToggle) purchasePriceToggle.checked = false;
      if (sellingPriceToggle) sellingPriceToggle.checked = false;
      if (amountUnitsToggle) amountUnitsToggle.checked = true;
      if (amountPacksToggle) amountPacksToggle.checked = false;
    }
    
    // Apply quick report settings
    if (savedSettings.quickReport) {
      const { showItemsSold, showItemsPurchased, showPayables, showReceivables } = savedSettings.quickReport;
      
      const itemsSoldToggle = document.getElementById('showItemsSold');
      const itemsPurchasedToggle = document.getElementById('showItemsPurchased');
      const payablesToggle = document.getElementById('showPayables');
      const receivablesToggle = document.getElementById('showReceivables');
      
      if (itemsSoldToggle) itemsSoldToggle.checked = showItemsSold;
      if (itemsPurchasedToggle) itemsPurchasedToggle.checked = showItemsPurchased;
      if (payablesToggle) payablesToggle.checked = showPayables;
      if (receivablesToggle) receivablesToggle.checked = showReceivables;
    } else {
      const itemsSoldToggle = document.getElementById('showItemsSold');
      const itemsPurchasedToggle = document.getElementById('showItemsPurchased');
      const payablesToggle = document.getElementById('showPayables');
      const receivablesToggle = document.getElementById('showReceivables');
      if (itemsSoldToggle) itemsSoldToggle.checked = true;
      if (itemsPurchasedToggle) itemsPurchasedToggle.checked = false;
      if (payablesToggle) payablesToggle.checked = true;
      if (receivablesToggle) receivablesToggle.checked = true;
    }
    

  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
}

function getEffectiveSettings() {
  // Defaults per request
  const defaults = {
    inventory: {
      showPurchasePrice: false,
      showSellingPrice: false,
      showAmountUnits: true,
      showAmountPacks: false
    },
    quickReport: {
      showItemsSold: true,
      showItemsPurchased: false,
      showPayables: true,
      showReceivables: true
    }
  };
  try {
    const saved = JSON.parse(localStorage.getItem('inventorySettings') || '{}');
    return {
      inventory: { ...defaults.inventory, ...(saved.inventory || {}) },
      quickReport: { ...defaults.quickReport, ...(saved.quickReport || {}) }
    };
  } catch {
    return defaults;
  }
}

// Detail Report Functions
let currentDuration = 'monthly';
let chart = null;

function initializeDetailReport() {
  const durationSelector = document.getElementById('durationSelector');
  const graphVariable = document.getElementById('graphVariable');
  
  if (durationSelector) {
    durationSelector.addEventListener('change', (e) => {
      currentDuration = e.target.value;
      updateDetailReport();
    });
  }
  
  if (graphVariable) {
    graphVariable.addEventListener('change', (e) => {
      updateGraph(e.target.value);
    });
  }
  
  // Initial load
  updateDetailReport();
}

function updateDetailReport() {
  updateMetrics();
  updatePayablesTable();
  updateReceivablesTable();
  updateHistoryList();
  updateStockReport();
  updateGraph(document.getElementById('graphVariable')?.value || 'profit');
}

function updateMetrics() {
  const { totalPurchases, totalSales, profit, payables, receivables, itemsSold } = calculateMetrics();
  
  // Update metric displays
  const elements = {
    totalPurchases: document.getElementById('totalPurchases'),
    totalSales: document.getElementById('totalSales'),
    totalProfit: document.getElementById('totalProfit'),
    totalPayables: document.getElementById('totalPayables'),
    totalReceivables: document.getElementById('totalReceivables'),
    totalItemsSold: document.getElementById('totalItemsSold')
  };
  
  if (elements.totalPurchases) elements.totalPurchases.textContent = `${Math.round(totalPurchases)} ETB`;
  if (elements.totalSales) elements.totalSales.textContent = `${Math.round(totalSales)} ETB`;
  if (elements.totalProfit) elements.totalProfit.textContent = `${Math.round(profit)} ETB`;
  if (elements.totalPayables) elements.totalPayables.textContent = `${Math.round(payables)} ETB`;
  if (elements.totalReceivables) elements.totalReceivables.textContent = `${Math.round(receivables)} ETB`;
  if (elements.totalItemsSold) elements.totalItemsSold.textContent = itemsSold.toString();
}

function calculateMetrics() {
  const now = new Date();
  const { startDate, endDate } = getDateRange(currentDuration);
  
  // Get sales data for the period
  const sales = getSalesForPeriod(startDate, endDate);
  
  // Calculate total sales
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  
  // Calculate total purchases for the period
  const totalPurchases = inventory.reduce((sum, item) => {
    if (item.createdAt) {
      const itemDate = new Date(item.createdAt);
      if (itemDate >= startDate && itemDate <= endDate) {
        const totalPieces = item.quantityValue * item.amountInPack;
        return sum + (item.purchasePrice * totalPieces);
      }
    }
    return sum;
  }, 0);
  
  // Calculate profit
  const profit = sales.reduce((sum, sale) => {
    const item = inventory.find(i => i.id === sale.itemId);
    if (item) {
      const unitProfit = (sale.unitPrice - item.purchasePrice);
      return sum + (unitProfit * sale.piecesSold);
    }
    return sum;
  }, 0);
  
  // Calculate payables (unpaid purchases)
  const payables = inventory.reduce((sum, item) => {
    if (item.createdAt && item.paymentStatus === 'unpaid') {
      const itemDate = new Date(item.createdAt);
      if (itemDate >= startDate && itemDate <= endDate) {
        const totalPieces = item.quantityValue * item.amountInPack;
        return sum + (item.purchasePrice * totalPieces);
      }
    }
    return sum;
  }, 0);
  
  // Calculate receivables (unpaid sales)
  const receivables = sales.reduce((sum, sale) => {
    if (sale.paymentStatus === 'unpaid') {
      return sum + sale.total;
    }
    return sum;
  }, 0);
  
  // Calculate total items sold
  const itemsSold = sales.reduce((sum, sale) => sum + (sale.piecesSold || 0), 0);
  
  return { totalPurchases, totalSales, profit, payables, receivables, itemsSold };
}

function getDateRange(duration) {
  const now = new Date();
  let startDate = new Date();
  
  switch (duration) {
    case 'weekly':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'annual':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { startDate, endDate: now };
}

function getSalesForPeriod(startDate, endDate) {
  const sales = [];
  
  // Get all sales from localStorage for the period
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = `sales_${currentDate.toISOString().slice(0, 10)}`;
    const daySales = JSON.parse(localStorage.getItem(dateKey) || '[]');
    sales.push(...daySales);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return sales;
}

function updatePayablesTable() {
  const tbody = document.getElementById('payablesTableBody');
  if (!tbody) return;
  
  const { startDate, endDate } = getDateRange(currentDuration);
  const unpaidItems = inventory.filter(item => 
    item.paymentStatus === 'unpaid' && 
    item.createdAt && 
    new Date(item.createdAt) >= startDate && 
    new Date(item.createdAt) <= endDate
  );
  
  tbody.innerHTML = unpaidItems.length > 0 ? 
    unpaidItems.map(item => {
      const totalPieces = item.quantityValue * item.amountInPack;
      const amount = item.purchasePrice * totalPieces;
      const date = new Date(item.createdAt).toLocaleDateString();
      return `
        <tr>
          <td>${item.name}</td>
          <td>${Math.round(amount)} ETB</td>
          <td>${date}</td>
        </tr>
      `;
    }).join('') : 
    '<tr><td colspan="3" style="text-align: center; color: #666;">No payables for this period</td></tr>';
}

function updateReceivablesTable() {
  const tbody = document.getElementById('receivablesTableBody');
  if (!tbody) return;
  
  const { startDate, endDate } = getDateRange(currentDuration);
  const sales = getSalesForPeriod(startDate, endDate);
  const unpaidSales = sales.filter(sale => sale.paymentStatus === 'unpaid');
  
  // Group by customer
  const customerTotals = {};
  unpaidSales.forEach(sale => {
    if (!customerTotals[sale.customerName]) {
      customerTotals[sale.customerName] = { amount: 0, date: sale.timestamp };
    }
    customerTotals[sale.customerName].amount += sale.total;
    if (sale.timestamp > customerTotals[sale.customerName].date) {
      customerTotals[sale.customerName].date = sale.timestamp;
    }
  });
  
  tbody.innerHTML = Object.keys(customerTotals).length > 0 ? 
    Object.entries(customerTotals).map(([customer, data]) => {
      const date = new Date(data.date).toLocaleDateString();
      return `
        <tr>
          <td>${customer}</td>
          <td>${Math.round(data.amount)} ETB</td>
          <td>${date}</td>
        </tr>
      `;
    }).join('') : 
    '<tr><td colspan="3" style="text-align: center; color: #666;">No receivables for this period</td></tr>';
}

function updateHistoryList() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;
  
  const { startDate, endDate } = getDateRange(currentDuration);
  const sales = getSalesForPeriod(startDate, endDate);
  
  // Create history entries from sales and purchases
  const historyEntries = [];
  
  // Add sales history
  sales.forEach(sale => {
    historyEntries.push({
      text: `Sold ${sale.piecesSold} ${sale.name} to ${sale.customerName}`,
      date: sale.timestamp,
      type: 'sale'
    });
  });
  
  // Add purchase history
  inventory.forEach(item => {
    if (item.createdAt) {
      const itemDate = new Date(item.createdAt);
      if (itemDate >= startDate && itemDate <= endDate) {
        historyEntries.push({
          text: `Bought ${item.quantityValue * item.amountInPack} ${item.name}`,
          date: item.createdAt,
          type: 'purchase'
        });
      }
    }
  });
  
  // Sort by date (newest first)
  historyEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Limit to 20 entries
  const limitedEntries = historyEntries.slice(0, 20);
  
  historyList.innerHTML = limitedEntries.length > 0 ? 
    limitedEntries.map(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      return `
        <div class="history-item">
          <div class="history-text">${entry.text}</div>
          <div class="history-date">${date}</div>
        </div>
      `;
    }).join('') : 
    '<div style="text-align: center; color: #666; padding: 20px;">No history for this period</div>';
}

function updateStockReport() {
  updateLowStockItems();
  updateHighStockItems();
  updateTopSellingItems();
  updateLowDemandItems();
}

function updateLowStockItems() {
  const container = document.getElementById('lowStockItems');
  if (!container) return;
  
  // Items with low stock (less than 10 pieces total)
  const lowStockItems = inventory.filter(item => {
    const totalPieces = item.quantityValue * item.amountInPack;
    return totalPieces < 10;
  }).slice(0, 3); // Show top 3
  
  container.innerHTML = lowStockItems.length > 0 ? 
    lowStockItems.map(item => {
      const totalPieces = item.quantityValue * item.amountInPack;
      return `
        <div class="stock-item">
          <div class="stock-item-name">${item.name}</div>
          <div class="stock-item-value">${totalPieces} pcs</div>
        </div>
      `;
    }).join('') : 
    '<div style="text-align: center; color: #666; padding: 10px;">No low stock items</div>';
}

function updateHighStockItems() {
  const container = document.getElementById('highStockItems');
  if (!container) return;
  
  // Items with high stock (more than 100 pieces total)
  const highStockItems = inventory.filter(item => {
    const totalPieces = item.quantityValue * item.amountInPack;
    return totalPieces > 100;
  }).slice(0, 3); // Show top 3
  
  container.innerHTML = highStockItems.length > 0 ? 
    highStockItems.map(item => {
      const totalPieces = item.quantityValue * item.amountInPack;
      return `
        <div class="stock-item">
          <div class="stock-item-name">${item.name}</div>
          <div class="stock-item-value">${totalPieces} pcs</div>
        </div>
      `;
    }).join('') : 
    '<div style="text-align: center; color: #666; padding: 10px;">No high stock items</div>';
}

function updateTopSellingItems() {
  const container = document.getElementById('topSellingItems');
  if (!container) return;
  
  // Get sales data for the last 30 days to determine top selling
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSales = getSalesForPeriod(thirtyDaysAgo, new Date());
  
  // Group sales by item and calculate total quantity sold
  const itemSales = {};
  recentSales.forEach(sale => {
    if (!itemSales[sale.name]) {
      itemSales[sale.name] = 0;
    }
    itemSales[sale.name] += sale.piecesSold;
  });
  
  // Get top 3 selling items
  const topSelling = Object.entries(itemSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  container.innerHTML = topSelling.length > 0 ? 
    topSelling.map(([name, quantity]) => `
      <div class="stock-item">
        <div class="stock-item-name">${name}</div>
        <div class="stock-item-value">${quantity} pcs sold</div>
      </div>
    `).join('') : 
    '<div style="text-align: center; color: #666; padding: 10px;">No sales data available</div>';
}

function updateLowDemandItems() {
  const container = document.getElementById('lowDemandItems');
  if (!container) return;
  
  // Items that haven't been sold in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSales = getSalesForPeriod(thirtyDaysAgo, new Date());
  
  const soldItemIds = new Set(recentSales.map(sale => sale.itemId));
  const lowDemandItems = inventory.filter(item => !soldItemIds.has(item.id)).slice(0, 3);
  
  container.innerHTML = lowDemandItems.length > 0 ? 
    lowDemandItems.map(item => {
      const totalPieces = item.quantityValue * item.amountInPack;
      return `
        <div class="stock-item">
          <div class="stock-item-name">${item.name}</div>
          <div class="stock-item-value">${totalPieces} pcs</div>
        </div>
      `;
    }).join('') : 
    '<div style="text-align: center; color: #666; padding: 10px;">All items have recent sales</div>';
}

function updateGraph(variable) {
  const canvas = document.getElementById('timeGraph');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const { startDate, endDate } = getDateRange(currentDuration);
  
  // Generate time labels based on duration
  const timeLabels = generateTimeLabels(startDate, endDate);
  const data = generateGraphData(variable, startDate, endDate, timeLabels);
  
  // Clear previous chart
  if (chart) {
    chart.destroy();
  }
  
  // Create new chart
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: [{
        label: getVariableLabel(variable),
        data: data,
        borderColor: '#43a047',
        backgroundColor: 'rgba(67, 160, 71, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  });
}

function generateTimeLabels(startDate, endDate) {
  const labels = [];
  const current = new Date(startDate);
  
  switch (currentDuration) {
    case 'weekly':
      while (current <= endDate) {
        labels.push(current.toLocaleDateString('en-US', { weekday: 'short' }));
        current.setDate(current.getDate() + 1);
      }
      break;
    case 'monthly':
      while (current <= endDate) {
        labels.push(current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        current.setDate(current.getDate() + 1);
      }
      break;
    case 'annual':
      while (current <= endDate) {
        labels.push(current.toLocaleDateString('en-US', { month: 'short' }));
        current.setMonth(current.getMonth() + 1);
      }
      break;
  }
  
  return labels;
}

function generateGraphData(variable, startDate, endDate, timeLabels) {
  const data = [];
  
  switch (currentDuration) {
    case 'weekly':
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push(calculateValueForDate(variable, date));
      }
      break;
    case 'monthly':
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push(calculateValueForDate(variable, date));
      }
      break;
    case 'annual':
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        data.push(calculateValueForMonth(variable, date));
      }
      break;
  }
  
  return data;
}

function calculateValueForDate(variable, date) {
  const dateKey = `sales_${date.toISOString().slice(0, 10)}`;
  const sales = JSON.parse(localStorage.getItem(dateKey) || '[]');
  
  switch (variable) {
    case 'profit':
      return sales.reduce((sum, sale) => {
        const item = inventory.find(i => i.id === sale.itemId);
        if (item) {
          const unitProfit = (sale.unitPrice - item.purchasePrice);
          return sum + (unitProfit * sale.piecesSold);
        }
        return sum;
      }, 0);
    case 'sales':
      return sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    case 'purchases':
      return inventory.reduce((sum, item) => {
        if (item.createdAt && item.createdAt.startsWith(dateKey.replace('sales_', ''))) {
          const totalPieces = item.quantityValue * item.amountInPack;
          return sum + (item.purchasePrice * totalPieces);
        }
        return sum;
      }, 0);
    default:
      return 0;
  }
}

function calculateValueForMonth(variable, date) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  let total = 0;
  const current = new Date(startOfMonth);
  
  while (current <= endOfMonth) {
    total += calculateValueForDate(variable, current);
    current.setDate(current.getDate() + 1);
  }
  
  return total;
}

function getVariableLabel(variable) {
  switch (variable) {
    case 'profit': return 'Profit';
    case 'sales': return 'Total Sales';
    case 'purchases': return 'Total Purchases';
    default: return 'Value';
  }
}

