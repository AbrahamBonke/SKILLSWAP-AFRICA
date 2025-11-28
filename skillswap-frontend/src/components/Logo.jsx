export default function Logo({ size = 'md', showText = true }) {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const textSizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  return (
    <div className="flex items-center gap-3">
      <img 
        src="/logo.png" 
        alt="SkillSwap Logo"
        className={`${sizeMap[size]} object-contain`}
      />

      {showText && (
        <span className={`${textSizeMap[size]} font-bold text-primary-900`}>
          SkillSwap
        </span>
      )}
    </div>
  );
}
