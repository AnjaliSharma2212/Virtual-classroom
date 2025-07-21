const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white text-center py-3 text-sm mt-8">
      &copy; {new Date().getFullYear()} Virtual Classroom. All rights reserved.
    </footer>
  );
};

export default Footer;
