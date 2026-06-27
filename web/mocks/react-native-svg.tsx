import React from "react";

// Web stub for react-native-svg
// Renders SVG elements as standard HTML SVG

export function Svg({ children, style, width, height, viewBox, ...props }: any) {
  return (
    <svg
      style={style}
      width={width}
      height={height}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function Circle({ cx, cy, r, fill, stroke, strokeWidth, ...props }: any) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />;
}

export function Rect({ x, y, width, height, fill, rx, ry, ...props }: any) {
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={rx} ry={ry} {...props} />;
}

export function Path({ d, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin, ...props }: any) {
  return <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} {...props} />;
}

export function Line({ x1, y1, x2, y2, stroke, strokeWidth, ...props }: any) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={strokeWidth} {...props} />;
}

export function Polyline({ points, fill, stroke, strokeWidth, ...props }: any) {
  return <polyline points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />;
}

export function Polygon({ points, fill, stroke, strokeWidth, ...props }: any) {
  return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />;
}

export function Ellipse({ cx, cy, rx, ry, fill, stroke, ...props }: any) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} stroke={stroke} {...props} />;
}

export function Text({ x, y, fill, fontSize, fontWeight, children, ...props }: any) {
  return <text x={x} y={y} fill={fill} fontSize={fontSize} fontWeight={fontWeight} {...props}>{children}</text>;
}

export function G({ children, ...props }: any) {
  return <g {...props}>{children}</g>;
}

export function Defs({ children }: any) {
  return <defs>{children}</defs>;
}

export function LinearGradient({ id, x1, y1, x2, y2, children }: any) {
  return <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>{children}</linearGradient>;
}

export function Stop({ offset, stopColor, stopOpacity }: any) {
  return <stop offset={offset} stopColor={stopColor} stopOpacity={stopOpacity} />;
}

export function ClipPath({ id, children }: any) {
  return <clipPath id={id}>{children}</clipPath>;
}

export function Mask({ id, children, ...props }: any) {
  return <mask id={id} {...props}>{children}</mask>;
}

export default Svg;
