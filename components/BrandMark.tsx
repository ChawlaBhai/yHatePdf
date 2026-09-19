export default function BrandMark({ className = "" }: { className?: string }) {
  return <span className={`brand-mark ${className}`} aria-label="Y heart PDF question mark">
    <span className="brand-letter">Y</span>
    <svg className="brand-heart" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="2" y="1" width="4" height="2" fill="#E4E4E7"/><rect x="10" y="1" width="4" height="2" fill="#E4E4E7"/>
      <rect x="1" y="3" width="6" height="2" fill="#E4E4E7"/><rect x="9" y="3" width="6" height="2" fill="#E4E4E7"/>
      <rect x="1" y="5" width="14" height="2" fill="#E4E4E7"/><rect x="2" y="7" width="12" height="2" fill="#D4D4D8"/>
      <rect x="4" y="9" width="8" height="2" fill="#A1A1AA"/><rect x="6" y="11" width="4" height="2" fill="#71717A"/>
      <rect x="7" y="13" width="2" height="1" fill="#3F3F46"/><rect x="3" y="2" width="2" height="1" fill="#FFFFFF"/>
      <rect x="11" y="2" width="2" height="1" fill="#FFFFFF"/><rect x="2" y="4" width="4" height="2" fill="#FFFFFF"/>
      <rect x="10" y="4" width="4" height="2" fill="#FFFFFF"/><rect x="2" y="6" width="12" height="1" fill="#FFFFFF"/>
      <rect x="3" y="4" width="2" height="2" fill="#FFFFFF"/><rect x="2" y="4" width="1" height="2" fill="#A1A1AA"/>
      <rect x="3" y="6" width="2" height="1" fill="#71717A"/>
      <rect x="8" y="5" width="1" height="4" fill="#09090B"/><rect x="7" y="8" width="1" height="3" fill="#09090B"/>
    </svg>
    <span className="brand-letter">PDF?</span>
  </span>;
}
