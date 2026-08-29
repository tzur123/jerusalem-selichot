import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/auth";
import { generateQrForStation, revokeQr } from "@/lib/qr/service";

const generateSchema = z.object({ stationId: z.string().uuid() });
const revokeSchema = z.object({ qrId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { token, url, qrImageUrl } = await generateQrForStation(parsed.data.stationId);

  return NextResponse.json({ token, url, qrImageUrl });
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  await revokeQr(parsed.data.qrId);
  return NextResponse.json({ success: true });
}
