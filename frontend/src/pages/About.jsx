import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Phone, MapPin, HelpCircle, Shield, FileText } from 'lucide-react';

const About = () => {
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            About LikeMind Connect
          </h1>
          <p className="text-xl text-gray-600">Connecting minds, building relationships</p>
        </div>
        
        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <p className="text-gray-700 leading-relaxed text-lg">
            LikeMind Connect is a modern social platform that brings together people with shared interests and values. 
            We believe meaningful connections are built on common ground and mutual understanding.
          </p>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <HelpCircle className="text-green-500 mr-3" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
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

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <Mail className="text-green-500 mr-3" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="text-gray-400 mr-3" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">General Inquiries</p>
                  <p className="text-green-600">hello@likemindconnect.com</p>
                </div>
              </div>
              <div className="flex items-center">
                <HelpCircle className="text-gray-400 mr-3" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Support</p>
                  <p className="text-green-600">support@likemindconnect.com</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <Phone className="text-gray-400 mr-3" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Phone Support</p>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="text-gray-400 mr-3" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Address</p>
                  <p className="text-gray-600">123 Tech Street, San Francisco, CA 94105</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Privacy */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center mb-6">
            <FileText className="text-green-500 mr-3" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Terms & Privacy</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Shield className="text-green-500 mr-3" size={24} />
                <h3 className="text-xl font-semibold text-gray-900">Privacy Policy</h3>
              </div>
              <p className="text-gray-700 mb-4">
                We take your privacy seriously. Your personal information is encrypted and never shared with third parties without your consent.
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Your data is encrypted and secure</li>
                <li>• We don't sell your information</li>
                <li>• You control your privacy settings</li>
                <li>• You can delete your account anytime</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center mb-4">
                <FileText className="text-blue-500 mr-3" size={24} />
                <h3 className="text-xl font-semibold text-gray-900">Terms of Service</h3>
              </div>
              <p className="text-gray-700 mb-4">
                By using LikeMind Connect, you agree to our terms of service and community guidelines.
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Be respectful to other users</li>
                <li>• No harassment or inappropriate content</li>
                <li>• Accurate profile information required</li>
                <li>• Report violations to our team</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              Last updated: January 2024 | Version 1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;