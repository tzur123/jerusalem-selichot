import { NextResponse } from "next/server";
import { getPublishedStations } from "@/lib/data/stations";

export async function GET() {
  const stations = await getPublishedStations();
  return NextResponse.json({ stations });
}
