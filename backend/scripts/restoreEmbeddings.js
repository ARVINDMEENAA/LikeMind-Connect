import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const restoreEmbeddings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Add back hobbyEmbeddings field to User schema
    const result = await mongoose.connection.db.collection('users').updateMany(
      {},
      { $set: { hobbyEmbeddings: [] } }
    );

    console.log(`Updated ${result.modifiedCount} users - restored hobbyEmbeddings field`);
    
    await mongoose.disconnect();
    console.log('Restore completed');
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
};

restoreEmbeddings();