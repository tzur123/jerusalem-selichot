import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#001B33",
          color: "#00F0A8",
          fontSize: 120,
          fontWeight: 900,
        }}
      >
        ס
      </div>
    ),
    { width: 192, height: 192 }
  );
}
