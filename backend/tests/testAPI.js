import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Create a test token for A gupta
const testUserId = '68d6cd735e1908b4d3899f07'; // A gupta
const testToken = jwt.sign(
  { userId: testUserId, email: 'a@test.com' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('Test token for A gupta:');
console.log(testToken);
console.log('\nUse this in Authorization header: Bearer ' + testToken);
console.log('\nTest API endpoint: GET http://localhost:5000/api/follow/dashboard-stats');