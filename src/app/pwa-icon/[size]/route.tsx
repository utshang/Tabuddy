import { ImageResponse } from "next/og"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params
  const s = Number(size) || 512

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#349ce1",
          color: "white",
          fontSize: s * 0.55,
          fontWeight: 700,
        }}
      >
        T
      </div>
    ),
    { width: s, height: s }
  )
}
