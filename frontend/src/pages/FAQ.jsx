import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How does LikeMind Connect work?",
      answer: "LikeMind Connect matches you with people based on shared hobbies and interests. Simply create your profile, add your hobbies, and we'll show you compatible matches in your area."
    },
    {
      question: "Is LikeMind Connect free to use?",
      answer: "Yes! Basic features including profile creation, matching, and messaging are completely free. We may introduce premium features in the future."
    },
    {
      question: "How do I update my hobbies?",
      answer: "Go to your profile settings and click 'Edit Profile'. You can add, remove, or modify your hobbies at any time to get better matches."
    },
    {
      question: "Can I control who sees my profile?",
      answer: "Yes, you have full control over your privacy settings. You can choose who can see your hobbies, send you chat requests, and view your profile information."
    },
    {
      question: "How do I report inappropriate behavior?",
      answer: "If you encounter any inappropriate behavior, please use the report feature on the user's profile or contact our support team immediately."
    },
    {
      question: "Can I delete my account?",
      answer: "Yes, you can delete your account at any time from the Settings page. This action is permanent and cannot be undone."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">Find answers to common questions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="text-green-500" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={20} />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;