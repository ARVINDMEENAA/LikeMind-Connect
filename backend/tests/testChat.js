import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test user credentials (you'll need to replace with actual user credentials)
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' }
];

async function testChatFlow() {
  try {
    console.log('Testing chat functionality...\n');
    
    // Login both users
    const user1Response = await axios.post(`${API_BASE}/auth/login`, testUsers[0]);
    const user2Response = await axios.post(`${API_BASE}/auth/login`, testUsers[1]);
    
    const user1Token = user1Response.data.token;
    const user2Token = user2Response.data.token;
    const user1Id = user1Response.data.user._id;
    const user2Id = user2Response.data.user._id;
    
    console.log('✅ Both users logged in successfully');
    console.log(`User 1 ID: ${user1Id}`);
    console.log(`User 2 ID: ${user2Id}\n`);
    
    // Test getting chats for user 1
    const chatsResponse = await axios.get(`${API_BASE}/chats`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    console.log('✅ Chats fetched for user 1:', chatsResponse.data.length, 'chats\n');
    
    // Test sending a message from user 1 to user 2
    const messageResponse = await axios.post(`${API_BASE}/chat`, {
      receiverId: user2Id,
      message: 'Hello from test script!'
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    console.log('✅ Message sent successfully:', messageResponse.data.message);
    console.log('Message data:', messageResponse.data.data, '\n');
    
    // Test getting chat messages between users
    const messagesResponse = await axios.get(`${API_BASE}/chat/${user2Id}`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    console.log('✅ Messages fetched:', messagesResponse.data.length, 'messages');
    if (messagesResponse.data.length > 0) {
      console.log('Latest message:', messagesResponse.data[messagesResponse.data.length - 1]);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testChatFlow();