# Firebase Backend Setup for Azernet Inventory

This guide explains how to set up and use Firebase as the backend for your Azernet Inventory Management System.

## What's Been Added

### 1. Firebase Configuration (`firebase-config.js`)
- Firebase app initialization with your provided configuration
- Import of all necessary Firebase services (Firestore, Auth, Storage)
- Export of Firebase services for use throughout the application

### 2. Firebase Service Layer (`firebase-service.js`)
- Complete service layer for all Firebase operations
- Authentication methods (sign up, sign in, sign out)
- Inventory management (CRUD operations)
- Sales tracking
- User profile management
- Image storage
- Settings management
- Real-time data synchronization

### 3. Authentication System (`auth.html` & `auth.js`)
- Beautiful login/signup page
- Form validation and error handling
- Automatic redirection after authentication
- User session management

### 4. Firebase-Integrated Inventory (`inventory-firebase.js`)
- Replaces IndexedDB with Firebase Firestore
- Real-time inventory updates
- User-specific data isolation
- Cloud-based data storage

## Firebase Services Used

### 1. **Firebase Authentication**
- Email/password authentication
- User session management
- Secure user identification

### 2. **Cloud Firestore**
- NoSQL database for inventory items
- Real-time data synchronization
- User-specific data collections
- Automatic scaling

### 3. **Firebase Storage**
- Profile image storage
- Item image storage
- Secure file access

## Database Structure

### Collections in Firestore:

#### `users` Collection
```javascript
{
  uid: "user123",
  email: "user@example.com",
  displayName: "Store Owner",
  storeName: "My Store",
  createdAt: "2024-01-01T00:00:00.000Z",
  profileImage: "https://..."
}
```

#### `inventory` Collection
```javascript
{
  id: "auto-generated",
  name: "Product Name",
  type: "Product Type",
  purchasePrice: 100,
  quantityType: "pieces",
  quantityValue: 50,
  amountInPack: 1,
  sellingPrice: 150,
  description: "Product description",
  image: "https://...",
  paymentStatus: "paid",
  userId: "user123",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

#### `sales` Collection
```javascript
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

#### `settings` Collection
```javascript
{
  userId: "user123",
  inventorySettings: {
    showItemType: true,
    showPurchasePrice: true,
    showSellingPrice: true,
    showDescription: true,
    showStock: true,
    showPaymentStatus: true
  },
  storeName: "My Store",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

## Security Rules

You'll need to set up Firestore security rules in your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Inventory items belong to specific users
    match /inventory/{itemId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Sales belong to specific users
    match /sales/{saleId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Settings belong to specific users
    match /settings/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

## Storage Rules

For Firebase Storage, set up these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile images: users can only access their own
    match /profile-images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Item images: users can only access their own
    match /item-images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

## How to Use

### 1. **Start with Authentication**
- Users first visit `auth.html`
- They can create a new account or sign in
- After successful authentication, they're redirected to `inventory.html`

### 2. **Automatic Data Sync**
- All inventory data is automatically synchronized in real-time
- Changes made on one device appear on all other devices
- No manual refresh needed

### 3. **User Isolation**
- Each user only sees their own inventory data
- Data is completely separated between users
- Secure and private

### 4. **Offline Support**
- Firebase provides offline support out of the box
- Data syncs when connection is restored
- No data loss during network issues

## Benefits of Firebase Backend

### ✅ **Scalability**
- Automatic scaling for any number of users
- No server management required
- Handles traffic spikes automatically

### ✅ **Real-time Updates**
- Instant synchronization across devices
- Live inventory updates
- Collaborative features possible

### ✅ **Security**
- Built-in authentication
- User data isolation
- Secure data transmission

### ✅ **Reliability**
- 99.9% uptime guarantee
- Automatic backups
- Global CDN

### ✅ **Cost-effective**
- Free tier for small to medium usage
- Pay-as-you-go pricing
- No upfront infrastructure costs

## Migration from IndexedDB

The system automatically handles the migration:
1. New users start with Firebase immediately
2. Existing users can continue using the system
3. All new data is stored in Firebase
4. No data loss during transition

## Next Steps

1. **Test the Authentication System**
   - Create a new account
   - Sign in with existing credentials
   - Test logout functionality

2. **Verify Data Persistence**
   - Add inventory items
   - Check if they persist across sessions
   - Test real-time updates

3. **Monitor Firebase Console**
   - Check user authentication
   - Monitor database usage
   - Review storage usage

4. **Customize Security Rules**
   - Adjust Firestore rules as needed
   - Modify storage rules if required
   - Test security measures

## Troubleshooting

### Common Issues:

1. **Authentication Errors**
   - Check Firebase configuration
   - Verify API keys are correct
   - Ensure Firebase project is active

2. **Database Permission Errors**
   - Review Firestore security rules
   - Check user authentication status
   - Verify collection names

3. **Storage Upload Failures**
   - Check storage security rules
   - Verify file size limits
   - Ensure proper file types

4. **Real-time Updates Not Working**
   - Check internet connection
   - Verify Firebase project status
   - Review console for errors

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Support](https://firebase.google.com/support)

For application-specific issues:
- Check browser console for errors
- Review network requests
- Verify Firebase configuration
