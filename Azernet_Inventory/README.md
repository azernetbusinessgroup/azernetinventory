# Azernet Inventory System

A complete inventory management system with user registration and authentication.

## Features

### Registration System
- Multi-step registration process
- User details collection (name, store name, store type)
- Email/phone and password authentication
- Multi-language support (English and Amharic)
- IndexedDB backend for user data storage

### Inventory System
- Add, edit, and delete inventory items
- Image upload support
- Local IndexedDB storage
- User authentication required
- Store-specific inventory management

## How It Works

### 1. User Registration
1. User starts at the splash screen
2. Clicks "Sign up" to begin registration
3. Enters email/phone and password
4. Fills in personal and store details
5. Completes verification process
6. User data is saved to IndexedDB

### 2. User Login
1. User enters email/phone and password
2. System checks against IndexedDB users
3. If valid, redirects to inventory system
4. User info is stored in localStorage for session management

### 3. Inventory Management
1. User must be authenticated to access inventory
2. Store name is displayed in header
3. Profile icon shows user information
4. Logout button available for session termination

## Technical Details

### Backend Storage
- **Users**: IndexedDB (UserDB)
- **Inventory**: IndexedDB (InventoryDB_[userId]) - Separate database for each user
- **Session**: localStorage for current user

### Database Structure
```javascript
// UserDB
{
  id: "user1234567890",
  name: "User Name",
  storeName: "Store Name",
  storeType: "Store Type",
  emailPhone: "user@example.com",
  password: "hashed_password"
}

// InventoryDB
{
  id: "001",
  name: "Item Name",
  type: "Item Type",
  purchasePrice: 100.00,
  quantityType: "pieces",
  quantityValue: 10,
  amountInPack: 12,
  sellingPrice: 150.00,
  description: "Item description",
  image: "data_url_or_path"
}
```

### Security Features
- Authentication required for inventory access
- Session management with localStorage
- Automatic redirect to login if not authenticated
- **User Isolation**: Each user has their own separate inventory database
- **Data Privacy**: Users cannot access other users' inventory data

## File Structure
```
├── index.html          # Registration and login interface
├── styles.css          # Registration system styles
├── script.js           # Registration system logic
├── inventory.html      # Inventory management interface
├── inventory.css       # Inventory system styles
├── inventory.js        # Inventory system logic
├── data.json           # Initial data (items and users)
└── README.md           # This file
```

## Usage

1. Open `index.html` in a web browser
2. Register a new account or login with existing credentials
3. Access the inventory system after successful authentication
4. Manage your inventory items
5. Use the logout button to end your session

## Browser Compatibility

This system uses modern web technologies:
- IndexedDB for local storage
- ES6+ JavaScript features
- Modern CSS features

Works best in:
- Chrome 51+
- Firefox 50+
- Safari 10+
- Edge 79+

## Notes

- All data is stored locally in the browser
- No server-side processing required
- Data persists between browser sessions
- Suitable for offline use
