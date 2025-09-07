interface LotteryBallProps {
  number: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function LotteryBall({ number, size = 'md' }: LotteryBallProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div 
      className={`lottery-ball rounded-full flex items-center justify-center text-white font-bold ${sizeClasses[size]}`}
      data-testid={`lottery-ball-${number}`}
    >
      {number}
    </div>
  );
}
