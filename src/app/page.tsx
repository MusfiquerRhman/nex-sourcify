import '../styles/globals.css';
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookiesStore = await cookies();
  const token = cookiesStore.get("access-token")?.value;

  // Redirect based on authentication status
  if (token) {
    redirect("/dashboard");
  }
  else {
    redirect('/signin');
  };
}
