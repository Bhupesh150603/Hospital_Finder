import './globals.css';
import Navbar from '@/components/Navbar';
import { Phone } from 'lucide-react';

export const metadata = {
  title: 'Emergency Hospital Finder',
  description: 'Find nearby hospitals with real-time specialty availability and live bed capacity.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />

        {children}

        {/* Floating Emergency Hotline Button */}
        <a
          href="tel:108"
          className="emergency-fab"
          id="emergency-call-btn"
          title="Call Ambulance (108)"
        >
          <div className="fab-icon-bubble">
            <Phone size={18} fill="white" strokeWidth={0} />
          </div>
          <div className="fab-text-col">
            <span className="fab-title">Call Ambulance (108)</span>
            <span className="fab-sub">TOLL FREE IMMEDIATE DISPATCH</span>
          </div>
        </a>
      </body>
    </html>
  );
}
