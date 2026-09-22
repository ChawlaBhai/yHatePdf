export default function BrandMark({ className = "" }: { className?: string }) {
  return <span className={`brand-mark ${className}`} aria-label="Why hate PDF?">
    <span className="brand-word">WHY</span>
    <span className="brand-hate" aria-hidden="true">
      <span className="brand-hate-word">HATE</span>
      <svg viewBox="0 0 100 38" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <path d="M18 3l-4 12 7-3-5 22M42 2l-5 13 8-3-6 23M67 3l-5 12 8-3-6 22M90 5l-5 10 7-2-5 19"/>
      </svg>
    </span>
    <span className="brand-letter">PDF?</span>
  </span>;
}
