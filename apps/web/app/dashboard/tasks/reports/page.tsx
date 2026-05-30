import { redirect } from "next/navigation";

export default function ReportsRoot() {
  redirect("/dashboard/tasks/reports/operations");
}
