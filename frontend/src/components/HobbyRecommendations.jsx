import { useState } from 'react';
import api from '../utils/api';

const HobbyRecommendations = () => {
  const [hobbies, setHobbies] = useState(['']);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const addHobby = () => setHobbies([...hobbies, '']);
  
  const updateHobby = (index, value) => {
    const updated = [...hobbies];
    updated[index] = value;
    setHobbies(updated);
  };

  const removeHobby = (index) => {
    setHobbies(hobbies.filter((_, i) => i !== index));
  };

  const submitHobbies = async () => {
    const validHobbies = hobbies.filter(h => h.trim());
    if (validHobbies.length === 0) return;

    setLoading(true);
    try {
      const response = await api.put('/profile/hobbies', { hobbies: validHobbies });
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Error submitting hobbies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hobby-recommendations">
      <div className="hobby-input">
        <h3>Your Hobbies</h3>
        {hobbies.map((hobby, index) => (
          <div key={index} className="hobby-item">
            <input
              type="text"
              value={hobby}
              onChange={(e) => updateHobby(index, e.target.value)}
              placeholder="Enter a hobby"
            />
            <button onClick={() => removeHobby(index)}>Remove</button>
          </div>
        ))}
        <button onClick={addHobby}>Add Hobby</button>
        <button onClick={submitHobbies} disabled={loading}>
          {loading ? 'Finding Matches...' : 'Get Recommendations'}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Recommended Users</h3>
          {recommendations.map((user) => (
            <div key={user.id} className="user-card">
              <img src={user.avatar || '/default-avatar.png'} alt={user.fullName} />
              <div className="user-info">
                <h4>{user.fullName}</h4>
                <p>{user.age} years old • {user.location}</p>
                <p>{user.occupation}</p>
                <p>{user.bio}</p>
                <div className="hobbies">
                  {user.hobbies.map((hobby, i) => (
                    <span key={i} className="hobby-tag">{hobby}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HobbyRecommendations;