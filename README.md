# Azernet Inventory System

A complete inventory management system with user registration and authentication, now featuring **Firebase backend** for cloud-based data storage and real-time synchronization.

## Features

### Registration System
- Multi-step registration process
- User details collection (name, store name, store type)
- Email/phone and password authentication
- Multi-language support (English and Amharic)
- **Firebase Authentication** for secure user management

### Inventory System
- Add, edit, and delete inventory items
- Image upload support
- **Firebase Firestore** for cloud-based data storage
- **Real-time synchronization** across devices
- User authentication required
- Store-specific inventory management

## How It Works

### 1. User Registration
1. User starts at the authentication page (`auth.html`)
2. Clicks "Sign up" to begin registration
3. Enters email and password
4. Fills in store name
5. Completes verification process
6. User data is saved to **Firebase Authentication** and **Firestore**

### 2. User Login
1. User enters email and password
2. System authenticates against **Firebase Authentication**
3. If valid, redirects to inventory system
4. User session is managed by Firebase

### 3. Inventory Management
1. User must be authenticated to access inventory
2. Store name is displayed in header
3. Profile icon shows user information
4. **Real-time data sync** with Firebase
5. Logout button available for session termination

## Technical Details

### Backend Storage
- **Users**: Firebase Authentication + Firestore (users collection)
- **Inventory**: Firebase Firestore (inventory collection) - User-specific data
- **Sales**: Firebase Firestore (sales collection) - Transaction tracking
- **Settings**: Firebase Firestore (settings collection) - User preferences
- **Images**: Firebase Storage - Profile and item images
- **Session**: Firebase Authentication session management

### Database Structure
```javascript
// Firestore Collections

// users collection
{
  uid: "user123",
  email: "user@example.com",
  displayName: "Store Owner",
  storeName: "My Store",
  createdAt: "2024-01-01T00:00:00.000Z",
  profileImage: "https://..."
}

// inventory collection
{
  id: "auto-generated",
  name: "Item Name",
  type: "Item Type",
  purchasePrice: 100.00,
  quantityType: "pieces",
  quantityValue: 10,
  amountInPack: 12,
  sellingPrice: 150.00,
  description: "Item description",
  image: "https://...",
  paymentStatus: "paid",
  userId: "user123",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}

// sales collection
{
  id: "auto-generated",
  itemId: "item123",
  itemName: "Product Name",
  quantity: 5,
  price: 150,
  total: 750,
  customerName: "Customer Name",
  date: "2024-01-01",
  userId: "user123",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Security Features
- **Firebase Authentication** for secure user management
- **Firestore Security Rules** for data access control
- **User Isolation**: Each user can only access their own data
- **Data Privacy**: Users cannot access other users' data
- **Secure Image Storage**: Firebase Storage with access control
- **Real-time Security**: Automatic session validation

## File Structure
```
├── auth.html              # Firebase authentication interface
├── auth.js                # Authentication logic
├── firebase-config.js     # Firebase configuration and services
├── firebase-service.js    # Firebase service layer
├── inventory.html         # Inventory management interface
├── inventory.css          # Inventory system styles
├── inventory-firebase.js  # Firebase-integrated inventory logic
├── inventory.js.backup    # Backup of original IndexedDB version
├── pwa.js                 # Progressive Web App functionality
├── manifest.json          # PWA manifest
├── styles.css             # Registration system styles
├── script.js              # Registration system logic
├── data.json              # Initial data (items and users)
├── FIREBASE_SETUP.md      # Detailed Firebase setup guide
└── README.md              # This file
```

## Usage

1. Open `auth.html` in a web browser
2. Register a new account or login with existing credentials
3. Access the inventory system after successful authentication
4. Manage your inventory items with real-time sync
5. Use the logout button to end your session

## Firebase Setup

Before using the system, you need to:

1. **Enable Firebase Services** in your Firebase Console:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage

2. **Set Security Rules** for Firestore and Storage (see `FIREBASE_SETUP.md`)

3. **Update Configuration** in `firebase-config.js` if needed

4. **Test Authentication** by creating a new account

## Browser Compatibility

This system uses modern web technologies:
- **Firebase SDK** for cloud services
- ES6+ JavaScript features (modules)
- Modern CSS features
- **Real-time data synchronization**

Works best in:
- Chrome 67+ (supports ES modules)
- Firefox 60+ (supports ES modules)
- Safari 11.1+ (supports ES modules)
- Edge 79+ (supports ES modules)

## Notes

- **All data is stored in Firebase cloud**
- **Real-time synchronization across devices**
- **Automatic backups and data persistence**
- **Secure user authentication**
- **Scalable cloud infrastructure**
- **Offline support with Firebase**

## Migration from IndexedDB

The system now uses Firebase instead of IndexedDB:
- **New users**: Start with Firebase immediately
- **Existing users**: Can continue using the system
- **Data migration**: Manual migration may be required for existing data
- **Benefits**: Real-time sync, cloud storage, better security
