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

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormDiv = document.getElementById('login-form');
const registerFormDiv = document.getElementById('register-form');
const langButtons = document.querySelectorAll('.lang-btn');

// Language translations
const translations = {
  en: {
    welcomeBack: "Welcome Back",
    signInToAccount: "Sign in to your account",
    createAccount: "Create Account",
    joinAzernet: "Join Azernet Inventory today",
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    signIn: "Sign In",
    createAccountBtn: "Create Account",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    signUp: "Sign Up",
    signInLink: "Sign In",
    loading: "Loading...",
    passwordMismatch: "Passwords do not match",
    registrationSuccess: "Account created successfully!",
    loginSuccess: "Welcome back!",
    errorOccurred: "An error occurred. Please try again.",
    invalidEmail: "Please enter a valid email address",
    weakPassword: "Password should be at least 6 characters",
    emailInUse: "Email is already in use",
    userNotFound: "User not found",
    wrongPassword: "Wrong password"
  },
  am: {
    welcomeBack: "እንደገና እንኳን ደስ አለዎት",
    signInToAccount: "ወደ መለያዎ ይግቡ",
    createAccount: "መለያ ይፍጠሩ",
    joinAzernet: "ዛሬ የ Azernet Inventory አባል ይሁኑ",
    fullName: "ሙሉ ስም",
    email: "ኢሜይል",
    password: "የይለፍ ቃል",
    confirmPassword: "የይለፍ ቃል ያረጋግጡ",
    signIn: "ግባ",
    createAccountBtn: "መለያ ይፍጠሩ",
    dontHaveAccount: "መለያ የለዎትም?",
    alreadyHaveAccount: "መለያ አለዎት?",
    signUp: "ይመዝገቡ",
    signInLink: "ግባ",
    loading: "በመጫን ላይ...",
    passwordMismatch: "የይለፍ ቃላት አይጣጣሙም",
    registrationSuccess: "መለያ በተሳካኝ ሁኔታ ተፈጥሯል!",
    loginSuccess: "እንደገና እንኳን ደስ አለዎት!",
    errorOccurred: "ስህተት ተከስቷል። እባክዎ እንደገና ይሞክሩ።",
    invalidEmail: "እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ",
    weakPassword: "የይለፍ ቃል ቢያንስ 6 ቁምፊ መሆን አለበት",
    emailInUse: "ኢሜይል አስቀድሞ ጥቅም ላይ ነው",
    userNotFound: "ተጠቃሚ አልተገኘም",
    wrongPassword: "የተሳሳተ የይለፍ ቃል"
  }
};

let currentLang = 'en';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already signed in
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in, store user data in localStorage and redirect to inventory page
      const userData = {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        storeName: (user.displayName || 'User') + "'s Store",
        storeType: 'General',
        emailPhone: user.email,
        profileImage: 'assets/profile.png'
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Redirect to inventory page
      window.location.href = 'inventory.html';
    }
  });

  // Set up form event listeners
  setupFormListeners();
  
  // Set up language switcher
  setupLanguageSwitcher();
  
  // Load initial language
  updateLanguage();
});

// Setup form event listeners
function setupFormListeners() {
  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
  });

  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleRegistration();
  });
}

// Setup language switcher
function setupLanguageSwitcher() {
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);
    });
  });
}

// Set language
function setLanguage(lang) {
  currentLang = lang;
  
  // Update active button
  langButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  
  updateLanguage();
}

// Update language throughout the UI
function updateLanguage() {
  const t = translations[currentLang];
  
  // Update form titles and subtitles
  document.querySelector('#login-form h2').textContent = t.welcomeBack;
  document.querySelector('#login-form .form-subtitle').textContent = t.signInToAccount;
  document.querySelector('#register-form h2').textContent = t.createAccount;
  document.querySelector('#register-form .form-subtitle').textContent = t.joinAzernet;
  
  // Update placeholders
  document.getElementById('registerName').placeholder = t.fullName;
  document.getElementById('loginEmail').placeholder = t.email;
  document.getElementById('registerEmail').placeholder = t.email;
  document.getElementById('loginPassword').placeholder = t.password;
  document.getElementById('registerPassword').placeholder = t.password;
  document.getElementById('confirmPassword').placeholder = t.confirmPassword;
  
  // Update button texts
  document.querySelector('#loginForm .btn-text').textContent = t.signIn;
  document.querySelector('#registerForm .btn-text').textContent = t.createAccountBtn;
  
  // Update form footer texts
  document.querySelector('#login-form .form-footer p').innerHTML = 
    `${t.dontHaveAccount} <button type="button" class="link-btn" onclick="showRegisterForm()">${t.signUp}</button>`;
  document.querySelector('#register-form .form-footer p').innerHTML = 
    `${t.alreadyHaveAccount} <button type="button" class="link-btn" onclick="showLoginForm()">${t.signInLink}</button>`;
}

// Show register form
function showRegisterForm() {
  loginFormDiv.classList.remove('active');
  registerFormDiv.classList.add('active');
}

// Show login form
function showLoginForm() {
  registerFormDiv.classList.remove('active');
  loginFormDiv.classList.add('active');
}

// Handle login
async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const submitBtn = loginForm.querySelector('.btn');
  
  // Validate inputs
  if (!email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    
    // Store user data in localStorage for the inventory page
    const userData = {
      id: userCredential.user.uid,
      name: userCredential.user.displayName,
      email: email,
      storeName: userCredential.user.displayName + "'s Store",
      storeType: 'General',
      emailPhone: email,
      profileImage: 'assets/profile.png'
    };
    localStorage.setItem('currentUser', JSON.stringify(userData));

    showNotification(translations[currentLang].loginSuccess, 'success');
    
    // Redirect to inventory page after a short delay
    setTimeout(() => {
      window.location.href = 'inventory.html';
    }, 1000);
    
  } catch (error) {
    console.error('Login error:', error);
    let message = translations[currentLang].errorOccurred;
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = translations[currentLang].userNotFound;
        break;
      case 'auth/wrong-password':
        message = translations[currentLang].wrongPassword;
        break;
      case 'auth/invalid-email':
        message = translations[currentLang].invalidEmail;
        break;
    }
    
    showNotification(message, 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// Handle registration
async function handleRegistration() {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitBtn = registerForm.querySelector('.btn');
  
  // Validate inputs
  if (!name || !email || !password || !confirmPassword) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showNotification(translations[currentLang].passwordMismatch, 'error');
    return;
  }
  
  if (password.length < 6) {
    showNotification(translations[currentLang].weakPassword, 'error');
    return;
  }
  
  // Show loading state
  setButtonLoading(submitBtn, true);
  
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    
    // Update user profile with display name
    await userCredential.user.updateProfile({
      displayName: name
    });
    
    // Store user data in localStorage for the inventory page
    const userData = {
      id: userCredential.user.uid,
      name: name,
      email: email,
      storeName: name + "'s Store",
      storeType: 'General',
      emailPhone: email,
      profileImage: 'assets/profile.png'
    };
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    showNotification(translations[currentLang].registrationSuccess, 'success');
    
    // Redirect to inventory page after successful registration
    setTimeout(() => {
      window.location.href = 'inventory.html';
    }, 1000);
    
  } catch (error) {
    console.error('Registration error:', error);
    let message = translations[currentLang].errorOccurred;
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = translations[currentLang].emailInUse;
        break;
      case 'auth/invalid-email':
        message = translations[currentLang].invalidEmail;
        break;
      case 'auth/weak-password':
        message = translations[currentLang].weakPassword;
        break;
    }
    
    showNotification(message, 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// Set button loading state
function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const container = document.getElementById('notificationContainer');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// Handle form validation
function validateForm(form) {
  const inputs = form.querySelectorAll('input[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    const inputGroup = input.closest('.input-group');
    
    if (!input.value.trim()) {
      inputGroup.classList.add('error');
      isValid = false;
    } else {
      inputGroup.classList.remove('error');
    }
  });
  
  return isValid;
}

// Real-time validation
document.addEventListener('input', (e) => {
  if (e.target.matches('input')) {
    const inputGroup = e.target.closest('.input-group');
    
    if (e.target.value.trim()) {
      inputGroup.classList.remove('error');
      inputGroup.classList.add('success');
    } else {
      inputGroup.classList.remove('success');
    }
  }
});

// Handle password confirmation validation
document.getElementById('confirmPassword').addEventListener('input', (e) => {
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = e.target.value;
  const inputGroup = e.target.closest('.input-group');
  
  if (confirmPassword && password !== confirmPassword) {
    inputGroup.classList.add('error');
    inputGroup.classList.remove('success');
  } else if (confirmPassword && password === confirmPassword) {
    inputGroup.classList.remove('error');
    inputGroup.classList.add('success');
  }
});
