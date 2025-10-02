const mongoose = require('mongoose');
import dotenv from 'dotenv';
const User = require('./models/User');
dotenv.config(); 

mongoose.connect('process.env.MONGO_URI')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkUsers() {
  try {
    const users = await User.find({}, 'email password');
    console.log('All users:');
    users.forEach(user => {
      console.log(`Email: ${user.email}, Password Hash: ${user.password}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
