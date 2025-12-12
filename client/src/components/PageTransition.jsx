import { useEffect } from 'react';

export default function PageTransition({ children }) {
  useEffect(() => {
    // Scroll to top on page change
    window.scrollTo(0, 0);
  }, [children]);

  return (
    <div className="animate-fade-in-up">
      {children}
    </div>
  );
}
