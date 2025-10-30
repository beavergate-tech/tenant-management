import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LandlordSidebar } from "@/components/landlord/landlord-sidebar"

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== "LANDLORD") {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <LandlordSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
