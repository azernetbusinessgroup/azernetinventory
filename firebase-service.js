import { db, auth, storage, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, ref, uploadBytes, getDownloadURL, deleteObject } from './firebase-config.js';

class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.inventoryUnsubscribe = null;
    this.salesUnsubscribe = null;
  }

  // Authentication methods
  async signUp(email, password, displayName) {
    try {
      console.log('FirebaseService.signUp called with:', { email, displayName });
      console.log('Auth object:', auth);
      console.log('createUserWithEmailAndPassword function:', createUserWithEmailAndPassword);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created:', user);
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        storeName: displayName + "'s Store"
      });
      
      console.log('User document created in Firestore');
      return user;
    } catch (error) {
      console.error('Error in signUp:', error);
      throw error;
    }
  }

  async signIn(email, password) {
    try {
      console.log('FirebaseService.signIn called with:', { email });
      console.log('Auth object:', auth);
      console.log('signInWithEmailAndPassword function:', signInWithEmailAndPassword);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User signed in:', user);
      return user;
    } catch (error) {
      console.error('Error in signIn:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.unsubscribeFromInventory();
      this.unsubscribeFromSales();
    } catch (error) {
      throw error;
    }
  }

  // User management
  async getCurrentUser() {
    return auth.currentUser;
  }

  async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error) {
      throw error;
    }
  }

  // Inventory methods
  async addInventoryItem(item) {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...item,
        userId: this.currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  async updateInventoryItem(itemId, updates) {
    try {
      await updateDoc(doc(db, 'inventory', itemId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteInventoryItem(itemId) {
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
    } catch (error) {
      throw error;
    }
  }

  async getInventoryItems(userId) {
    try {
      const q = query(
        collection(db, 'inventory'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  }

  // Real-time inventory listener
  subscribeToInventory(userId, callback) {
    const q = query(
      collection(db, 'inventory'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    this.inventoryUnsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(items);
    });
  }

  unsubscribeFromInventory() {
    if (this.inventoryUnsubscribe) {
      this.inventoryUnsubscribe();
      this.inventoryUnsubscribe = null;
    }
  }

  // Sales methods
  async addSale(saleData) {
    try {
      const docRef = await addDoc(collection(db, 'sales'), {
        ...saleData,
        userId: this.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  async getSales(userId, startDate, endDate) {
    try {
      const q = query(
        collection(db, 'sales'),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  }

  // Real-time sales listener
  subscribeToSales(userId, startDate, endDate, callback) {
    const q = query(
      collection(db, 'sales'),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    this.salesUnsubscribe = onSnapshot(q, (querySnapshot) => {
      const sales = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(sales);
    });
  }

  unsubscribeFromSales() {
    if (this.salesUnsubscribe) {
      this.salesUnsubscribe();
      this.salesUnsubscribe = null;
    }
  }

  // Image storage methods
  async uploadImage(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      throw error;
    }
  }

  async deleteImage(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      throw error;
    }
  }

  // Settings methods
  async saveSettings(userId, settings) {
    try {
      await setDoc(doc(db, 'settings', userId), {
        ...settings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw error;
    }
  }

  async getSettings(userId) {
    try {
      const doc = await getDoc(doc(db, 'settings', userId));
      if (doc.exists()) {
        return doc.data();
      }
      return {};
    } catch (error) {
      throw error;
    }
  }

  // Initialize service with current user
  setCurrentUser(user) {
    this.currentUser = user;
  }
}

// Create and export singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
