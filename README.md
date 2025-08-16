# Azernet Inventory - Firebase Authentication Web App

A beautiful, modern inventory management system with Firebase Authentication, built using only HTML, CSS, and JavaScript with CDN imports. Perfect for deployment on GitHub Pages.

## Features

### 🔐 Firebase Authentication
- **User Registration**: Create new accounts with email and password
- **User Login**: Secure authentication with Firebase Auth
- **Session Management**: Automatic redirects and session persistence
- **Logout Functionality**: Secure logout with Firebase signOut

### 💾 Local Data Storage
- **IndexedDB**: Primary storage for large datasets
- **localStorage Fallback**: Backup storage for older browsers
- **Offline First**: Works completely offline
- **Data Persistence**: Data survives browser restarts
- **User Isolation**: Each user has separate data storage

### 🎨 Beautiful UI/UX
- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Elegant transitions and hover effects
- **Language Support**: English and Amharic language options

### 📱 Progressive Web App (PWA)
- **Offline Capable**: Service worker for offline functionality
- **Installable**: Can be installed on mobile devices
- **Fast Loading**: Optimized for performance
- **Local Data Storage**: IndexedDB and localStorage fallback
- **Background Sync**: Automatic data synchronization when online
- **Push Notifications**: Real-time updates and alerts

## File Structure

```
├── index.html          # Login/Registration page
├── inventory.html      # Main inventory management page
├── auth.css           # Authentication page styles
├── auth.js            # Firebase authentication logic
├── localStorage.js    # Local data storage management
├── inventory.css      # Inventory page styles
├── inventory.js       # Inventory management logic
├── pwa.js            # Progressive Web App functionality
├── manifest.json      # PWA manifest
├── service-worker.js  # Service worker for offline support
└── assets/           # Images and icons
```

## Setup Instructions

### 1. Firebase Configuration
The app is already configured with your Firebase project:
- **Project ID**: azernet-inventory-9d886
- **Authentication**: Email/Password enabled
- **Hosting**: Ready for GitHub Pages deployment

### 2. GitHub Pages Deployment
1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (usually `main` or `master`)
4. Your app will be available at `https://username.github.io/repository-name`

### 3. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `azernet-inventory-9d886`
3. Enable Authentication > Sign-in method > Email/Password
4. Add your domain to authorized domains (for GitHub Pages)

## Installation & Usage

### 📱 Installing the App
1. **Open in Browser**: Navigate to your deployed app URL
2. **Install Prompt**: Look for the "📱 Install App" button (bottom right)
3. **Add to Home Screen**: Click install and follow browser prompts
4. **App Icon**: The app will appear on your home screen
5. **Offline Access**: Works completely offline once installed

### 🔐 Authentication Flow
1. **First Visit**: Users see the login page
2. **Registration**: New users can create accounts
3. **Login**: Existing users sign in with email/password
4. **Access Control**: Unauthenticated users are redirected to login
5. **Session**: Users stay logged in until logout

### Language Support
- **English**: Default language
- **Amharic**: Ethiopian language support
- **Toggle**: Language switcher in the bottom of auth forms

## Security Features

- **Firebase Auth**: Industry-standard authentication
- **Input Validation**: Client-side and server-side validation
- **Session Management**: Secure session handling
- **Redirect Protection**: Unauthorized access prevention

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Dependencies

All dependencies are loaded via CDN:
- **Firebase**: Authentication and app initialization
- **Chart.js**: Data visualization (for inventory charts)
- **No npm packages required**

## Customization

### Styling
- Modify `auth.css` for authentication page styling
- Modify `inventory.css` for inventory page styling
- Colors and themes can be easily changed in CSS variables

### Functionality
- `auth.js`: Authentication logic and form handling
- `inventory.js`: Inventory management features
- `pwa.js`: Progressive Web App functionality

## Support

For technical support or questions:
- **Email**: Azernetbusiness@gmail.com
- **Phone**: +251951068598, +251983845420
- **Telegram**: @Azernetbusiness

## License

This project is proprietary software developed by Azernet Business Group.

---

**Azernet Business Group** - Integrating technology into traditional business practices in Ethiopia.
