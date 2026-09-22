export default function BrandMark({ className = "" }: { className?: string }) {
  return <span className={`brand-mark ${className}`} aria-label="Why hate PDF?">
    <span className="brand-word">WHY</span>
    <svg className="brand-hate" viewBox="0 0 134 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="skewX(-5)">
        <text x="4" y="35" className="brand-hate-fill">HATE</text>
        <text x="4" y="35" className="brand-hate-stroke">HATE</text>
        <path d="M28 6l-5 12 8-3-6 20M58 4l-7 13 9-3-5 23M88 5l-5 11 8-2-7 22M116 8l-7 10 8-2-5 18" className="brand-crack"/>
      </g>
    </svg>
    <span className="brand-letter">PDF?</span>
  </span>;
}
