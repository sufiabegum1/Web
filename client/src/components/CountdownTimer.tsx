import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  simple?: boolean;
}

export function CountdownTimer({ targetDate, simple = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (simple) {
    const total = timeLeft.days * 24 + timeLeft.hours;
    if (timeLeft.days > 0) {
      return (
        <div className="text-lg font-bold text-primary" data-testid="countdown-simple">
          {timeLeft.days}d {timeLeft.hours}h
        </div>
      );
    } else {
      return (
        <div className="text-lg font-bold text-primary" data-testid="countdown-simple">
          {timeLeft.hours}h {timeLeft.minutes}m
        </div>
      );
    }
  }

  return (
    <div className="flex justify-center space-x-3 mb-6" data-testid="countdown-detailed">
      {timeLeft.days > 0 && (
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-50"></div>
          <div className="relative bg-gradient-to-br from-purple-500 to-purple-700 text-white px-4 py-3 rounded-2xl font-bold shadow-lg">
            <div className="text-2xl" data-testid="countdown-days">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="text-xs opacity-90">DAYS</div>
          </div>
        </div>
      )}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-sm opacity-50"></div>
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white px-4 py-3 rounded-2xl font-bold shadow-lg">
          <div className="text-2xl" data-testid="countdown-hours">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs opacity-90">HRS</div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur-sm opacity-50"></div>
        <div className="relative bg-gradient-to-br from-yellow-500 to-orange-600 text-white px-4 py-3 rounded-2xl font-bold shadow-lg">
          <div className="text-2xl" data-testid="countdown-minutes">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs opacity-90">MIN</div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-sm opacity-50 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white px-4 py-3 rounded-2xl font-bold shadow-lg animate-bounce-gentle">
          <div className="text-2xl" data-testid="countdown-seconds">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs opacity-90">SEC</div>
        </div>
      </div>
    </div>
  );
}
