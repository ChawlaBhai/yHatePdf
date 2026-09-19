type BrandMarkProps = { className?: string };
export default function BrandMark({ className = "" }: BrandMarkProps) { return <span className={`brand-mark-wrap ${className}`} aria-label="Y heart PDF question mark"><b>Y</b><span className="pixel-heart" aria-hidden="true">{Array.from({ length: 10 }).map((_, index) => <i key={index} />)}</span><b>PDF?</b></span>; }
