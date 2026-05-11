import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name } = await req.json();
  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name,
      properties: {
        exp: Math.floor(Date.now() / 1000) + 86400,
        enable_chat: true,
        enable_screenshare: true,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.error ?? "Room creation failed" }, { status: 400 });
  return NextResponse.json({ url: data.url });
}
