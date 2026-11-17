import { redirect } from "next/navigation";

// The dashboard arrives in version 5.
export default function Home() {
  redirect("/syllabus");
}
