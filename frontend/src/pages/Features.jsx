import React from 'react';
import { Heart, Users, MessageCircle, Shield, Zap, Target } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Heart className="text-red-500" size={32} />,
      title: "Smart Matching",
      description: "AI-powered algorithm matches you with people who share your hobbies and interests"
    },
    {
      icon: <Users className="text-blue-500" size={32} />,
      title: "Community Building",
      description: "Join groups and communities based on your favorite activities and passions"
    },
    {
      icon: <MessageCircle className="text-green-500" size={32} />,
      title: "Real-time Chat",
      description: "Connect instantly with matches through our secure messaging system"
    },
    {
      icon: <Shield className="text-purple-500" size={32} />,
      title: "Privacy First",
      description: "Your data is encrypted and protected. Control who sees your information"
    },
    {
      icon: <Zap className="text-yellow-500" size={32} />,
      title: "Instant Connections",
      description: "Get matched with like-minded people in your area within seconds"
    },
    {
      icon: <Target className="text-orange-500" size={32} />,
      title: "Hobby-Based Matching",
      description: "Find people who share your exact interests and hobbies"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Features
          </h1>
          <p className="text-xl text-gray-600">Discover what makes LikeMind Connect special</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                {feature.icon}
                <h3 className="text-xl font-bold text-gray-900 ml-3">{feature.title}</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Connect?</h2>
          <p className="text-xl mb-6">Join thousands of users finding meaningful connections</p>
          <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Get Started Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default Features;