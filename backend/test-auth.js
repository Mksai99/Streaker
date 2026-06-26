import 'dotenv/config';
import { db } from './src/config/firebase.js';
import AuthService from './src/services/auth.service.js';

async function run() {
  console.log('DB Type:', typeof db.collection);
  const email = 'direct@test.com';
  
  console.log('1. Registering...');
  try {
    const res = await AuthService.registerWithEmail({ email, password: 'password', displayName: 'Direct', role: 'customer' });
    console.log('Registered UID:', res.user.uid);
  } catch (e) {
    console.log('Register Error:', e.message);
  }

  console.log('2. Querying Supabase directly...');
  const snapshot = await db.collection('users').get();
  console.log('Total users:', snapshot.size);
  const user = snapshot.docs.find(d => d.data().email === email);
  if (user) console.log('Found user!', user.data().email);
  else console.log('User NOT found in all users!');
}

run();
