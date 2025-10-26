import { useState, useEffect } from 'react';

export function useSessionValidation(session, domain) {
  const [isValid, setIsValid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!session || !domain) {
      setIsValid(false);
      return;
    }

    // Check if session is for the current domain
    if (session.domain !== domain.id) {
      setIsValid(false);
      return;
    }

    const checkValidity = () => {
      const now = Date.now();
      const sessionStart = session.startTime;
      const sessionEnd = sessionStart + (60 * 60 * 1000); // 1 hour
      const remaining = sessionEnd - now;

      if (remaining > 0) {
        setIsValid(true);
        setTimeRemaining(remaining);
        return true;
      } else {
        setIsValid(false);
        setTimeRemaining(0);
        return false;
      }
    };

    // Initial check
    checkValidity();

    // Check every second
    const interval = setInterval(() => {
      checkValidity();
    }, 1000);

    return () => clearInterval(interval);
  }, [session, domain]);

  return { isValid, timeRemaining };
}
