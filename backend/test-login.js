import fetch from 'node-fetch';

async function testLogin() {
  const email = 'test@example.com';
  const password = 'password123';
  const role = 'shopOwner';

  console.log('Testing Registration...');
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: 'Test', role })
  });
  const regData = await regRes.json();
  console.log('Register Response:', regData);

  console.log('Testing Login...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
  const loginData = await loginRes.json();
  console.log('Login Response:', loginData);
}

testLogin();
