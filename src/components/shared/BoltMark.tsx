// The KGR lightning bolt used in badges and bento cards across the design.
interface BoltMarkProps {
  fill?: string;
  width?: number;
  height?: number;
  className?: string;
}

const BoltMark = ({
  fill = "#0FF338",
  width = 26,
  height = 34,
  className,
}: BoltMarkProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 26 34"
    className={className}
    aria-hidden="true"
  >
    <polygon points="10,0 24,0 14,13 26,13 2,34 10,18 0,18" fill={fill} />
  </svg>
);

export default BoltMark;
