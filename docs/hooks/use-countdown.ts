import { useState, useCallback } from 'react';

// ----------------------------------------------------------------------

type ReturnSecondsType = {
  counting: boolean;
  countdown: number;
  startCountdown: VoidFunction;
  setCountdown: React.Dispatch<React.SetStateAction<number>>;
};

export function useCountdownSeconds(initCountdown: number): ReturnSecondsType {
  const [countdown, setCountdown] = useState(initCountdown);

  const startCountdown = useCallback(() => {
    let remainingSeconds = countdown;

    const intervalId = setInterval(() => {
      remainingSeconds -= 1;

      if (remainingSeconds === 0) {
        clearInterval(intervalId);
        setCountdown(initCountdown);
      } else {
        setCountdown(remainingSeconds);
      }
    }, 1000);
  }, [initCountdown, countdown]);

  const counting = initCountdown > countdown;

  return { counting, countdown, setCountdown, startCountdown };
}
