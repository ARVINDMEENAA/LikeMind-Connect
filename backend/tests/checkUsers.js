const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://abdulrehman78454:abdul123@cluster0.mongodb.net/likemind?retryWrites=true&w=majority')
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