import ReportTabs from "@/app/ui/tasks/report-tabs";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ReportTabs />
      {children}
    </div>
  );
}
