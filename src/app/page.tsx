import { redirect } from "next/navigation";

export default async function Home() {
  redirect("/login");
}

export const dynamic = 'force-dynamic'
