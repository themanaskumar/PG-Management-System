const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto py-6">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        
        {/* Left Side: Copyright */}
        <div className="mb-2 md:mb-0">
          &copy; {currentYear} <span className="font-bold text-gray-700">DLF Boys' Hostel</span>. All rights reserved.
        </div>

        {/* Right Side: Links (Optional but looks good) */}
        <div className="flex gap-4">
          <a href="#" className="hover:text-blue-600 transition">Privacy Policy</a>
          <a href="#" className="hover:text-blue-600 transition">Terms of Service</a>
          <a href="#" className="hover:text-blue-600 transition">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;