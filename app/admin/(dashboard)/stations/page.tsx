import { getAllStationsAdmin } from "@/lib/data/stations";
import { StationsList } from "@/components/admin/StationsList";

export const metadata = { title: "ניהול תחנות", robots: { index: false } };

export default async function AdminStationsPage() {
  const stations = await getAllStationsAdmin();
  return <StationsList stations={stations} />;
}
