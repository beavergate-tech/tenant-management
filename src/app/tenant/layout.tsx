import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TenantSidebar } from "@/components/tenant/tenant-sidebar"

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "TENANT") {
    redirect("/landlord/dashboard")
  }

  return (
    <div className="flex h-screen">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  )
}
