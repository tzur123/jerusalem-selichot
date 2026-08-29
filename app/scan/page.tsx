import { Scanner } from "@/components/scan/Scanner";

export const metadata = { title: "סריקת QR", robots: { index: false } };

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; station?: string }>;
}) {
  const { error } = await searchParams;
  return <Scanner initialError={error} />;
}
