import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1b1d1f",
          color: "#f6f5f1",
          fontFamily: "monospace",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        <span style={{ color: "#2b5d4f" }}>&gt;</span>jw
      </div>
    ),
    { ...size }
  );
}
