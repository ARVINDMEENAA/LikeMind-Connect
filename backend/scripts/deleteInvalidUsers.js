import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const deleteInvalidUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Total users found: ${users.length}`);

    let deletedCount = 0;
    const invalidUsers = [];

    for (const user of users) {
      try {
        // Test if password hash is valid by trying to compare with any string
        const testResult = await bcrypt.compare('test', user.password);
        // If bcrypt.compare doesn't throw error, hash is valid
      } catch (error) {
        // If bcrypt.compare throws error, hash is invalid
        console.log(`Invalid password hash for user: ${user.email}`);
        invalidUsers.push(user);
      }
    }

    if (invalidUsers.length === 0) {
      console.log('No users with invalid password hashes found');
      return;
    }

    console.log(`Found ${invalidUsers.length} users with invalid password hashes:`);
    invalidUsers.forEach(user => console.log(`- ${user.email}`));

    // Delete invalid users
    for (const user of invalidUsers) {
      await User.findByIdAndDelete(user._id);
      deletedCount++;
      console.log(`Deleted user: ${user.email}`);
    }

    console.log(`Successfully deleted ${deletedCount} users with invalid password hashes`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

deleteInvalidUsers();