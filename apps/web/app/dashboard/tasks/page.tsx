import { redirect } from "next/navigation";

export default function TasksRoot() {
  redirect("/dashboard/tasks/board");
}
