import { generateStars, planetPixels, type PlanetPalette } from "@/lib/pixelSpace";

const STARS = generateStars(42, 400, 220);

export function PixelPlanet({
  cx,
  cy,
  grid,
  scale,
  palette,
  ring,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  grid: number;
  scale: number;
  palette: PlanetPalette;
  ring?: boolean;
  opacity?: number;
}) {
  const cells = planetPixels(grid, palette);
  return (
    <g
      transform={`translate(${cx - (grid * scale) / 2} ${cy - (grid * scale) / 2})`}
      opacity={opacity}
    >
      {cells.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x * scale}
          y={cell.y * scale}
          width={scale}
          height={scale}
          fill={cell.fill}
        />
      ))}
      {ring && (
        <rect
          x={-scale * 3}
          y={(grid / 2 - 0.6) * scale}
          width={(grid + 6) * scale}
          height={scale * 0.7}
          fill={palette.dark}
          opacity={0.75}
          transform={`rotate(-14 ${(grid * scale) / 2} ${(grid * scale) / 2})`}
        />
      )}
    </g>
  );
}

export function PixelSpaceBackground() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 220"
      preserveAspectRatio="none"
    >
      <PixelPlanet
        cx={378}
        cy={200}
        grid={14}
        scale={5}
        opacity={0.55}
        ring
        palette={{ light: "#7fa8c9", mid: "#3d5f7a", dark: "#1c2d3b" }}
      />
      <PixelPlanet
        cx={6}
        cy={4}
        grid={9}
        scale={4}
        opacity={0.4}
        palette={{ light: "#c97b5f", mid: "#7a3d2e", dark: "#3b1f18" }}
      />
      {STARS.map((star, i) => (
        <rect
          key={i}
          x={star.x}
          y={star.y}
          width={star.size}
          height={star.size}
          fill="#ffffff"
          style={{
            animation: `pixel-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            ["--star-min" as string]: star.min,
            ["--star-max" as string]: 1,
          }}
        />
      ))}
    </svg>
  );
}
