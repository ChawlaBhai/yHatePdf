export default function BrandMark({ className = "" }: { className?: string }) {
  return <span className={`brand-mark ${className}`} aria-label="Why hate PDF?">
    <span className="brand-word">WHY</span>
    <svg className="brand-hate" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M3 2h11l5 5v13H3z" fill="#F4F4F5"/>
      <path d="M14 2v5h5" fill="#A1A1AA"/>
      <path d="M2 3h2v16h14v2H2z" fill="#71717A"/>
      <path d="M5 10h4v2H5zm8 0h4v2h-4zM8 16h6v2H8z" fill="#09090B"/>
      <path d="M9 7h4v2h-2v2H9v2H7v2H5v-3h2v-2h2z" fill="#FF5B45"/>
      <path d="M12 5h2v3h-2zm-2 8h2v3h-2z" fill="#09090B"/>
    </svg>
    <span className="brand-letter">PDF?</span>
  </span>;
}
