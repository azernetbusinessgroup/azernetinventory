import firebaseService from './firebase-service.js';
import { onAuthStateChanged } from './firebase-config.js';

// Debug: Check if Firebase service is loaded
console.log('Firebase service loaded:', firebaseService);
console.log('onAuthStateChanged loaded:', onAuthStateChanged);

// DOM elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const switchForm = document.getElementById('switchForm');
const loginSwitchText = document.getElementById('loginSwitchText');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Form switching
let isLoginMode = true;

switchForm.addEventListener('click', (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  
  if (isLoginMode) {
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
    loginSwitchText.textContent = "Don't have an account? ";
    switchForm.textContent = 'Sign up';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'flex';
    loginSwitchText.textContent = 'Already have an account? ';
    switchForm.textContent = 'Sign in';
  }
  
  // Clear messages
  hideMessages();
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  setLoading('login', true);
  hideMessages();
  
  try {
    console.log('Attempting to sign in with:', email);
    const user = await firebaseService.signIn(email, password);
    console.log('Sign in successful:', user);
    firebaseService.setCurrentUser(user);
    showSuccess('Login successful! Redirecting...');
    
    // Redirect to inventory page after short delay
    setTimeout(() => {
      window.location.href = 'inventory.html';
    }, 1500);
    
  } catch (error) {
    console.error('Login error:', error);
    showError(getErrorMessage(error.code));
  } finally {
    setLoading('login', false);
  }
});

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;
  
  if (!name || !email || !password || !confirmPassword) {
    showError('Please fill in all fields');
    return;
  }
  
  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }
  
  if (password.length < 6) {
    showError('Password must be at least 6 characters long');
    return;
  }
  
  setLoading('signup', true);
  hideMessages();
  
  try {
    console.log('Attempting to sign up with:', email, name);
    const user = await firebaseService.signUp(email, password, name);
    console.log('Sign up successful:', user);
    firebaseService.setCurrentUser(user);
    showSuccess('Account created successfully! Redirecting...');
    
    // Redirect to inventory page after short delay
    setTimeout(() => {
      window.location.href = 'inventory.html';
    }, 1500);
    
  } catch (error) {
    console.error('Signup error:', error);
    showError(getErrorMessage(error.code));
  } finally {
    setLoading('signup', false);
  }
});

// Utility functions
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

function hideMessages() {
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';
}

function setLoading(type, isLoading) {
  const btn = document.getElementById(`${type}Btn`);
  const btnText = document.getElementById(`${type}BtnText`);
  const loading = document.getElementById(`${type}Loading`);
  
  if (isLoading) {
    btn.disabled = true;
    btnText.style.display = 'none';
    loading.style.display = 'block';
  } else {
    btn.disabled = false;
    btnText.style.display = 'inline';
    loading.style.display = 'none';
  }
}

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
}

// Check if user is already authenticated
onAuthStateChanged(firebaseService.auth, (user) => {
  if (user) {
    // User is signed in, redirect to inventory page
    firebaseService.setCurrentUser(user);
    window.location.href = 'inventory.html';
  }
});
