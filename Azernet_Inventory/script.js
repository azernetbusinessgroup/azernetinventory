document.addEventListener('DOMContentLoaded', () => {
  const screens = {
    splash: document.getElementById('splash-screen'),
    signin: document.getElementById('signin-screen'),
    userdetails: document.getElementById('userdetails-screen'),
    verification: document.getElementById('verification-screen'),
    registrationComplete: document.getElementById('registration-complete-screen')
  };

  const forms = {
    signin: document.getElementById('signin-form'),
    userdetails: document.getElementById('userdetails-form'),
    verification: document.getElementById('verification-form')
  };

  const signupBtn = document.getElementById('signup-btn');
  const langButtons = document.querySelectorAll('.lang-btn');
  const goToLoginBtn = document.getElementById('go-to-login-btn');
  const backToSigninBtn = document.getElementById('back-to-signin-btn');

  // Initialize IndexedDB for users
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
      // Load initial users from data.json if IndexedDB is empty
      loadInitialUsers();
    };
    request.onerror = (event) => {
      console.error('UserDB IndexedDB error:', event.target.error);
    };
  }

  function loadInitialUsers() {
    if (!userDB) return;
    
    const transaction = userDB.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      const users = event.target.result;
      if (users.length === 0) {
        // Load from data.json if no users in IndexedDB
        fetch('data.json')
          .then(response => response.json())
          .then(data => {
            if (data.users && data.users.length > 0) {
              data.users.forEach(user => saveUserToDB(user));
            }
          })
          .catch(error => console.error('Error loading initial users:', error));
      }
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

  function getUserFromDB(emailPhone, password) {
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
        const user = users.find(u => u.emailPhone === emailPhone && u.password === password);
        resolve(user);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  Object.values(screens).forEach(screen => {
    if (screen !== screens.splash) screen.classList.add('hidden');
  });

  setTimeout(() => {
    screens.splash.classList.add('hidden');
    screens.signin.classList.remove('hidden');
  }, 3000);

  signupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (forms.signin.checkValidity()) {
      screens.signin.classList.add('hidden');
      screens.userdetails.classList.remove('hidden');
    } else {
      forms.signin.reportValidity();
    }
  });

  forms.userdetails.addEventListener('submit', (e) => {
    e.preventDefault();
    screens.userdetails.classList.add('hidden');
    screens.verification.classList.remove('hidden');
  });

  forms.verification.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const storeName = document.getElementById('storename').value;
    const storeType = document.getElementById('storetype').value;
    const emailPhone = document.getElementById('email-phone').value;
    const password = document.getElementById('password').value;

    saveUserData({ name, storeName, storeType, emailPhone, password });
    screens.verification.classList.add('hidden');
    screens.registrationComplete.classList.remove('hidden');
  });

  goToLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    screens.registrationComplete.classList.add('hidden');
    screens.signin.classList.remove('hidden');
  });

  backToSigninBtn.addEventListener('click', (e) => {
    e.preventDefault();
    screens.userdetails.classList.add('hidden');
    screens.signin.classList.remove('hidden');
  });

  langButtons.forEach(button => {
    button.addEventListener('click', () => {
      langButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      console.log(`Language changed to ${button.dataset.lang}`);
    });
  });

  forms.signin.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailPhone = document.getElementById('email-phone').value;
    const password = document.getElementById('password').value;

    getUserFromDB(emailPhone, password)
      .then(user => {
        if (user) {
          console.log('Login successful for:', emailPhone);
          // Store user info in localStorage for inventory system
          localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            storeName: user.storeName,
            storeType: user.storeType,
            emailPhone: user.emailPhone,
            profileImage: user.profileImage || ''
          }));
          window.location.href = 'inventory.html';
        } else {
          // Highlight password input in red for incorrect password
          const passwordInput = document.querySelector('input[type="password"]');
          if (passwordInput) {
            passwordInput.style.borderColor = '#f44336';
            passwordInput.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
          }
        }
      })
      .catch(error => {
        console.error('Error during login:', error);
        // Highlight both inputs in red for login failure
        const emailPhoneInput = document.querySelector('input[type="text"], input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        if (emailPhoneInput) {
          emailPhoneInput.style.borderColor = '#f44336';
          emailPhoneInput.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
        }
        if (passwordInput) {
          passwordInput.style.borderColor = '#f44336';
          passwordInput.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
        }
      });
  });

  // Email/Phone validation function
  function validateEmailOrPhone(value) {
    if (value.includes('@')) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    } else {
      // Ethiopian phone validation
      const phoneRegex = /^(\+251|0)[0-9]{9}$/;
      return phoneRegex.test(value);
    }
  }

  document.querySelectorAll('input[required]').forEach(input => {
    input.addEventListener('blur', () => {
      if (!input.value.trim()) {
        input.style.borderColor = 'red';
        input.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
      } else if (input.type === 'text' && input.placeholder.toLowerCase().includes('email') || input.placeholder.toLowerCase().includes('phone')) {
        // Validate email/phone format
        if (!validateEmailOrPhone(input.value.trim())) {
          input.style.borderColor = '#f44336';
          input.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
        } else {
          input.style.borderColor = '#2e7d32';
          input.style.boxShadow = 'none';
        }
      } else {
        input.style.borderColor = '#2e7d32';
        input.style.boxShadow = 'none';
      }
    });
    
    // Clear error styling on input
    input.addEventListener('input', () => {
      if (input.style.borderColor === 'red' || input.style.borderColor === 'rgb(244, 67, 54)') {
        input.style.borderColor = '#2e7d32';
        input.style.boxShadow = 'none';
      }
    });
  });

  const translations = {
    en: {
      login: "Log in",
      signup: "Sign up",
      emailPhone: "Email or Phone Number",
      password: "Password",
      name: "Your full name",
      storename: "Store name",
      storetype: "Store type",
      enter: "Enter",
      backToSignin: "Back to Sign In",
      verificationcode: "Enter verification code",
      verificationMsg: "We will send a verification code to your email or phone number after completion of 300 birr payment.",
      done: "Done",
      registrationSuccess: "Registration successful! You can now log in.",
      goToLogin: "Go to Login",
      english: "English",
      amharic: "Amharic"
    },
    am: {
      login: "ግባ",
      signup: "ይመዝገቡ",
      emailPhone: "ኢሜይል ወይም ስልክ ቁጥር",
      password: "የይለፍ ቃል",
      name: "ሙሉ ስምዎ",
      storename: "የመደብር ስም",
      storetype: "የመደብር አይነት",
      enter: "አስገባ",
      backToSignin: "ወደ መግባት ተመለስ",
      verificationcode: "የማረጋገጫ ቁጥር አስገባ",
      verificationMsg: "የ300 ብር ክፍያ ካጠናቀቃችሁ በኋላ ወደ ኢሜይልዎ ወይም ስልክ ቁጥርዎ ማረጋገጊያ ኮድ እንልካለን።",
      done: "ተጠናቀቀ",
      registrationSuccess: "ተሳታፊ ሲሆን! አሁን መግባት ይችላሉ።",
      goToLogin: "ወደ መግባት",
      english: "እንግሊዝኛ",
      amharic: "አማርኛ"
    }
  };

  function changeLanguage(lang) {
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.dataset.translate;
      if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
      const key = el.dataset.translatePlaceholder;
      if (translations[lang][key]) el.placeholder = translations[lang][key];
    });
  }

  let currentLanguage = 'en';
  changeLanguage(currentLanguage);

  langButtons.forEach(button => {
    button.addEventListener('click', () => {
      const lang = button.dataset.lang;
      if (currentLanguage !== lang) {
        currentLanguage = lang;
        changeLanguage(currentLanguage);
      }
    });
  });

  function saveUserData(userData) {
    const newUser = {
      id: `user${Date.now()}`,
      name: userData.name,
      storeName: userData.storeName,
      storeType: userData.storeType,
      emailPhone: userData.emailPhone,
      password: userData.password
    };
    
    // Save to IndexedDB
    saveUserToDB(newUser);
    
    // Also update data.json to keep it in sync
    fetch('data.json')
      .then(response => response.json())
      .then(data => {
        if (!data.users) data.users = [];
        data.users.push(newUser);
        
        // Note: In a real application, you'd send this to a server
        // For now, we'll just log it and save to IndexedDB
        console.log('User registered:', newUser);
      })
      .catch(error => console.error('Error updating data.json:', error));
  }

  // Initialize the user database
  initUserDB();
});