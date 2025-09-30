const { encrypt, decrypt } = require('../utils/encryption');
const cloudinary = require('cloudinary').v2;

// Encrypt file before Cloudinary upload
const encryptFileUpload = async (req, res, next) => {
  if (req.file) {
    // Encrypt original filename
    const encryptedName = encrypt(req.file.originalname);
    req.file.originalname = encryptedName;
  }
  next();
};

// Decrypt file data when retrieving
const decryptFileData = (fileData) => {
  if (fileData && fileData.original_filename) {
    fileData.original_filename = decrypt(fileData.original_filename);
  }
  return fileData;
};

// Secure Pinecone data
const encryptPineconeData = (metadata) => {
  if (metadata) {
    if (metadata.name) metadata.name = encrypt(metadata.name);
    if (metadata.bio) metadata.bio = encrypt(metadata.bio);
    if (metadata.hobbies) metadata.hobbies = metadata.hobbies.map(h => encrypt(h));
  }
  return metadata;
};

const decryptPineconeData = (metadata) => {
  if (metadata) {
    if (metadata.name) metadata.name = decrypt(metadata.name);
    if (metadata.bio) metadata.bio = decrypt(metadata.bio);
    if (metadata.hobbies) metadata.hobbies = metadata.hobbies.map(h => decrypt(h));
  }
  return metadata;
};

module.exports = {
  encryptFileUpload,
  decryptFileData,
  encryptPineconeData,
  decryptPineconeData
};