import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm">&copy; 2024 LikeMind Connect. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <Link to="/about" className="text-sm hover:text-gray-300">
              About
            </Link>
            <Link to="/settings" className="text-sm hover:text-gray-300">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;