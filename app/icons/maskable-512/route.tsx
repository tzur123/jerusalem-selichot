import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// Maskable icon: keep content within the safe ~80% zone so OS masks don't clip it.
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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 380,
            height: 380,
            borderRadius: 190,
            background: "#00F0A8",
            color: "#001B33",
            fontSize: 220,
            fontWeight: 900,
          }}
        >
          ס
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
