import React from 'react';
import { Youtube, Linkedin, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 text-white py-3 z-50 shadow-lg" style={{ backgroundColor: '#128c7e' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          
          {/* Left side - Contact */}
          <div className="flex items-center space-x-4 text-base order-2 md:order-1">
            <a 
              href="mailto:info@rhythmstix.co.uk" 
              className="text-white hover:text-blue-200 transition-colors duration-200 font-medium"
            >
              ✉️ Contact Us
            </a>
          </div>

          {/* Center - Social Media */}
          <div className="flex items-center justify-center space-x-8 order-1 md:order-2">
            <a 
              href="https://www.youtube.com/channel/UCooHhU7FKALUQ4CtqjDFMsw"
              className="text-white hover:text-red-400 transition-colors duration-200 p-3 rounded-md"
              style={{ 
                backgroundColor: '#128c7e',
                ':hover': { backgroundColor: '#0f7468' }
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f7468'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#128c7e'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <Youtube className="h-6 w-6" />
            </a>
            <a 
              href="https://www.linkedin.com/in/robert-reich-storer-974449144"
              className="text-white hover:text-blue-300 transition-colors duration-200 p-3 rounded-md"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f7468'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#128c7e'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-6 w-6" />
            </a>
            <a 
              href="https://www.facebook.com/Rhythmstix-Music-108327688309431"
              className="text-white hover:text-blue-300 transition-colors duration-200 p-3 rounded-md"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f7468'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#128c7e'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <Facebook className="h-6 w-6" />
            </a>
          </div>

          {/* Right side - Copyright and Privacy */}
          <div className="flex items-center space-x-4 text-base order-3">
            <a 
              href="https://www.rhythmstix.co.uk/policy"
              className="text-white hover:text-blue-200 transition-colors duration-200 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
            <span className="text-white">•</span>
            <a 
              href="https://www.rhythmstix.co.uk"
              className="text-white hover:text-blue-200 transition-colors duration-200 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              © 2025 Rhythmstix
            </a>
          </div>
          
        </div>
      </div>
    </footer>
  );
}