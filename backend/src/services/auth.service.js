import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, auth, FieldValue } from '../config/firebase.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadBase64Image } from '../utils/storage.js';

class AuthService {
  generateToken(uid, role) {
    return jwt.sign({ uid, role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  _getCollection(role) {
    return role === 'shopOwner' ? 'shopOwners' : 'users';
  }

  async _checkCrossRole(field, value, intendedRole) {
    const otherRole = intendedRole === 'shopOwner' ? 'customer' : 'shopOwner';
    const otherCollection = this._getCollection(otherRole);
    const snapshot = await db.collection(otherCollection).where(field, '==', value).get();
    
    if (!snapshot.empty) {
      const OtherRoleName = otherRole === 'shopOwner' ? 'Shop Owner' : 'Customer';
      throw new AppError(`This account is registered as a ${OtherRoleName}. Please use the ${OtherRoleName} Login.`, 403);
    }
  }

  async verifyOTP({ token, role }) {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const phone = decodedToken.phone_number || '+1234567890';
      const uid = decodedToken.uid;

      if (!phone) {
        throw new AppError('No phone number found in token.', 400);
      }

      const collectionName = this._getCollection(role);
      let usersSnapshot = await db.collection(collectionName).where('phone', '==', phone).get();
      
      if (usersSnapshot.empty) {
        // Check if registered as the other role
        await this._checkCrossRole('phone', phone, role);

        // Create new user
        const userData = {
          uid,
          email: '',
          displayName: 'User ' + phone.slice(-4),
          role: role,
          phone,
          avatar: '',
          qrCode: `STREAKIFY_${uid}_${Date.now()}`,
          suspended: false,
          darkMode: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (role === 'customer') {
          userData.loyaltyLevel = 'bronze';
          userData.totalVisits = 0;
          userData.totalRewards = 0;
          userData.currentStreak = 0;
          userData.longestStreak = 0;

          await db.collection('streaks').doc(uid).set({
            userId: uid,
            currentStreak: 0,
            longestStreak: 0,
            lastVisitDate: null,
            streakStartDate: null,
            gracePeriodUsed: false,
            updatedAt: new Date().toISOString()
          });
        }

        await db.collection(collectionName).doc(uid).set(userData);

        await db.collection('notifications').add({
          userId: uid,
          type: 'welcome',
          title: 'Welcome to Streakify! 🎉',
          message: role === 'customer' ? 'Your account is ready. Start building your streak to earn amazing rewards.' : 'Welcome to your Shop Owner dashboard. Register your business to start!',
          read: false,
          createdAt: new Date().toISOString()
        });

        const jwtToken = this.generateToken(uid, role);
        return { user: userData, token: jwtToken };
      }

      const userData = usersSnapshot.docs[0].data();
      if (userData.suspended) {
        throw new AppError('Account has been suspended.', 403);
      }

      await db.collection(collectionName).doc(userData.uid).update({
        lastLoginAt: new Date().toISOString()
      });

      const jwtToken = this.generateToken(userData.uid, userData.role);
      return { user: userData, token: jwtToken };

    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'OTP Verification failed', 401);
    }
  }

  async loginWithGoogle({ uid, email, displayName, avatar, role }) {
    try {
      if (!email) {
        throw new AppError('Email is required for Google login.', 400);
      }

      const collectionName = this._getCollection(role);
      let usersSnapshot = await db.collection(collectionName).where('email', '==', email).get();

      if (usersSnapshot.empty) {
        await this._checkCrossRole('email', email, role);

        const userData = {
          uid,
          email,
          displayName: displayName || 'Google User',
          role: role,
          phone: '',
          avatar: avatar || '',
          qrCode: `STREAKIFY_${uid}_${Date.now()}`,
          suspended: false,
          darkMode: false,
          authProvider: 'google',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (role === 'customer') {
          userData.loyaltyLevel = 'bronze';
          userData.totalVisits = 0;
          userData.totalRewards = 0;
          userData.currentStreak = 0;
          userData.longestStreak = 0;

          await db.collection('streaks').doc(uid).set({
            userId: uid,
            currentStreak: 0,
            longestStreak: 0,
            lastVisitDate: null,
            streakStartDate: null,
            gracePeriodUsed: false,
            updatedAt: new Date().toISOString()
          });
        }

        await db.collection(collectionName).doc(uid).set(userData);

        await db.collection('notifications').add({
          userId: uid,
          type: 'welcome',
          title: 'Welcome to Streakify! 🎉',
          message: role === 'customer' ? 'Your account is ready. Start building your streak to earn amazing rewards.' : 'Welcome to your Shop Owner dashboard. Register your business to start!',
          read: false,
          createdAt: new Date().toISOString()
        });

        const jwtToken = this.generateToken(uid, role);
        return { user: userData, token: jwtToken };
      }

      const userData = usersSnapshot.docs[0].data();
      
      if (userData.suspended) {
        throw new AppError('Account has been suspended.', 403);
      }

      await db.collection(collectionName).doc(userData.uid).update({
        lastLoginAt: new Date().toISOString(),
        avatar: avatar || userData.avatar
      });

      const jwtToken = this.generateToken(userData.uid, userData.role);
      return { user: { ...userData, avatar: avatar || userData.avatar }, token: jwtToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Google login failed', 401);
    }
  }

  async loginOrRegisterByPhone({ phone, role }) {
    try {
      let formatted = phone.replace(/\D/g, '');
      if (!formatted.startsWith('91') && formatted.length >= 10) {
        formatted = '91' + formatted;
      }
      formatted = '+' + formatted;

      const collectionName = this._getCollection(role);
      let usersSnapshot = await db.collection(collectionName).where('phone', '==', formatted).get();

      if (usersSnapshot.empty) {
        await this._checkCrossRole('phone', formatted, role);

        const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userData = {
          uid,
          email: '',
          displayName: 'User ' + formatted.slice(-4),
          role: role,
          phone: formatted,
          avatar: '',
          qrCode: `STREAKIFY_${uid}_${Date.now()}`,
          suspended: false,
          darkMode: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (role === 'customer') {
          userData.loyaltyLevel = 'bronze';
          userData.totalVisits = 0;
          userData.totalRewards = 0;
          userData.currentStreak = 0;
          userData.longestStreak = 0;

          await db.collection('streaks').doc(uid).set({
            userId: uid,
            currentStreak: 0,
            longestStreak: 0,
            lastVisitDate: null,
            streakStartDate: null,
            gracePeriodUsed: false,
            updatedAt: new Date().toISOString()
          });
        }

        await db.collection(collectionName).doc(uid).set(userData);

        await db.collection('notifications').add({
          userId: uid,
          type: 'welcome',
          title: 'Welcome to Streakify! 🎉',
          message: role === 'customer' ? 'Your account is ready. Start building your streak to earn amazing rewards.' : 'Welcome to your Shop Owner dashboard. Register your business to start!',
          read: false,
          createdAt: new Date().toISOString()
        });

        const jwtToken = this.generateToken(uid, role);
        return { user: userData, token: jwtToken };
      }

      const userData = usersSnapshot.docs[0].data();
      if (userData.suspended) {
        throw new AppError('Account has been suspended.', 403);
      }

      await db.collection(collectionName).doc(userData.uid).update({
        lastLoginAt: new Date().toISOString()
      });

      const jwtToken = this.generateToken(userData.uid, userData.role);
      return { user: userData, token: jwtToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Phone login failed', 401);
    }
  }

  async registerWithEmail({ email, password, displayName, role }) {
    try {
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const collectionName = this._getCollection(role);
      const usersSnapshot = await db.collection(collectionName).where('email', '==', email).get();
      if (!usersSnapshot.empty) {
        throw new AppError('User already exists with this email in this portal', 400);
      }

      await this._checkCrossRole('email', email, role);

      const hashedPassword = await bcrypt.hash(password, 12);
      let uid;
      
      try {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: displayName || 'User',
        });
        uid = userRecord.uid;
      } catch (authErr) {
        throw new AppError(authErr.message, 400);
      }
      
      const userData = {
        uid,
        email,
        password: hashedPassword,
        displayName: displayName || 'User',
        role: role,
        phone: '',
        avatar: '',
        qrCode: `STREAKIFY_${uid}_${Date.now()}`,
        suspended: false,
        darkMode: false,
        authProvider: 'email',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (role === 'customer') {
        userData.loyaltyLevel = 'bronze';
        userData.totalVisits = 0;
        userData.totalRewards = 0;
        userData.currentStreak = 0;
        userData.longestStreak = 0;

        await db.collection('streaks').doc(uid).set({
          userId: uid,
          currentStreak: 0,
          longestStreak: 0,
          lastVisitDate: null,
          streakStartDate: null,
          gracePeriodUsed: false,
          updatedAt: new Date().toISOString()
        });
      }

      await db.collection(collectionName).doc(uid).set(userData);

      const jwtToken = this.generateToken(uid, role);
      const { password: _, ...userWithoutPassword } = userData;
      return { user: userWithoutPassword, token: jwtToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Registration failed', 401);
    }
  }

  async loginWithEmail({ email, password, role }) {
    try {
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const collectionName = this._getCollection(role);
      const usersSnapshot = await db.collection(collectionName).where('email', '==', email).get();
      
      if (usersSnapshot.empty) {
        await this._checkCrossRole('email', email, role);
        throw new AppError('Invalid email or password', 401);
      }

      const userData = usersSnapshot.docs[0].data();
      
      if (userData.authProvider === 'google' && !userData.password) {
        throw new AppError('Please sign in with Google', 401);
      }

      if (userData.suspended) {
        throw new AppError('Account has been suspended.', 403);
      }

      const isValid = await bcrypt.compare(password, userData.password);
      if (!isValid) {
        throw new AppError('Invalid email or password', 401);
      }

      await db.collection(collectionName).doc(userData.uid).update({
        lastLoginAt: new Date().toISOString()
      });

      const jwtToken = this.generateToken(userData.uid, role);
      const { password: _, ...userWithoutPassword } = userData;
      return { user: userWithoutPassword, token: jwtToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Login failed', 401);
    }
  }

  async forgotPassword(email, role) {
    const collectionName = this._getCollection(role);
    const usersSnapshot = await db.collection(collectionName).where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return { message: 'If an account exists with this email in this portal, a reset link has been sent.' };
    }

    const resetToken = uuidv4();
    const userData = usersSnapshot.docs[0].data();
    
    await db.collection(collectionName).doc(userData.uid).update({
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });

    return { 
      message: 'If an account exists with this email in this portal, a reset link has been sent.',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    };
  }

  async resetPassword({ token, newPassword, role }) {
    const collectionName = this._getCollection(role);
    const usersSnapshot = await db.collection(collectionName)
      .where('resetToken', '==', token)
      .get();

    if (usersSnapshot.empty) {
      throw new AppError('Invalid or expired reset token.', 400);
    }

    const userData = usersSnapshot.docs[0].data();
    
    if (new Date(userData.resetTokenExpiry) < new Date()) {
      throw new AppError('Reset token has expired.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await db.collection(collectionName).doc(userData.uid).update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: new Date().toISOString()
    });

    return { message: 'Password reset successfully.' };
  }

  async getProfile(uid, role) {
    const collectionName = this._getCollection(role);
    const userDoc = await db.collection(collectionName).doc(uid).get();
    if (!userDoc.exists) {
      throw new AppError('User not found in ' + role + ' portal.', 404);
    }
    const userData = userDoc.data();
    const { password: _, ...userWithoutPassword } = userData;
    return userWithoutPassword;
  }

  async updateProfile(uid, role, updates) {
    const collectionName = this._getCollection(role);
    const allowedFields = ['displayName', 'phone', 'avatar', 'darkMode'];
    const filteredUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (updates.avatar) {
      filteredUpdates.avatar = await uploadBase64Image(updates.avatar, 'images', `profiles/${uid}`);
    }

    filteredUpdates.updatedAt = new Date().toISOString();
    
    await db.collection(collectionName).doc(uid).update(filteredUpdates);
    return this.getProfile(uid, role);
  }

  async changePassword(uid, role, { currentPassword, newPassword }) {
    const collectionName = this._getCollection(role);
    const userDoc = await db.collection(collectionName).doc(uid).get();
    const userData = userDoc.data();

    const isValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.collection(collectionName).doc(uid).update({
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    return { message: 'Password changed successfully.' };
  }
}

export default new AuthService();
