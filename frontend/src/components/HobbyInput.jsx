import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const HobbyInput = ({ hobbies, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const addHobby = () => {
    if (inputValue.trim() && !hobbies.includes(inputValue.trim())) {
      onChange([...hobbies, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeHobby = (index) => {
    onChange(hobbies.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type a hobby"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 outline-none"
        />
        <button
          type="button"
          onClick={addHobby}
          className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {hobbies.map((hobby, index) => (
          <span
            key={index}
            className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
          >
            {hobby}
            <button
              onClick={() => removeHobby(index)}
              className="hover:bg-green-200 rounded-full p-1"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default HobbyInput;