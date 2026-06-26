import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';
import { AppError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const collectionName = decoded.role === 'shopOwner' ? 'shopOwners' : 'users';
    
    // Get user from database
    const userDoc = await db.collection(collectionName).doc(decoded.uid).get();
    if (!userDoc.exists) {
      throw new AppError('User not found.', 401);
    }

    const userData = userDoc.data();
    if (userData.suspended) {
      throw new AppError('Account has been suspended.', 403);
    }

    req.user = { uid: decoded.uid, ...userData };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions.', 403));
    }
    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const collectionName = decoded.role === 'shopOwner' ? 'shopOwners' : 'users';
      const userDoc = await db.collection(collectionName).doc(decoded.uid).get();
      if (userDoc.exists) {
        req.user = { uid: decoded.uid, ...userDoc.data() };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  next();
};
