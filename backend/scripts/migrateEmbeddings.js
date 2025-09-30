import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateEmbeddings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove hobbyEmbeddings field from all users
    const result = await mongoose.connection.db.collection('users').updateMany(
      {},
      { $unset: { hobbyEmbeddings: "" } }
    );

    console.log(`Updated ${result.modifiedCount} users - removed hobbyEmbeddings field`);
    
    await mongoose.disconnect();
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateEmbeddings();