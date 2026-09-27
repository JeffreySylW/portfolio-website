import { generateStars } from "@/lib/pixelSpace";
import { PixelPlanet } from "./PixelSpaceBackground";

const STARS = generateStars(90, 1000, 700, 500);

export function MissionStarfield() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
    >
      <PixelPlanet
        cx={880}
        cy={120}
        grid={16}
        scale={6}
        opacity={0.3}
        ring
        palette={{ light: "#7fa8c9", mid: "#3d5f7a", dark: "#1c2d3b" }}
      />
      <PixelPlanet
        cx={80}
        cy={560}
        grid={12}
        scale={5}
        opacity={0.22}
        palette={{ light: "#c97b5f", mid: "#7a3d2e", dark: "#3b1f18" }}
      />
      <PixelPlanet
        cx={620}
        cy={640}
        grid={7}
        scale={3}
        opacity={0.18}
        palette={{ light: "#b7bcc4", mid: "#6e747c", dark: "#33373d" }}
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
            ["--star-max" as string]: 0.85,
          }}
        />
      ))}
    </svg>
  );
}
