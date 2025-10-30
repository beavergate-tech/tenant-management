import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const session = await auth()

  if (session) {
    if (session.user.role === "LANDLORD") {
      redirect("/landlord/dashboard")
    } else {
      redirect("/tenant/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-4xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Tenant Management Platform
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Comprehensive property and tenant management solution for landlords and tenants
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login">
            <Button size="lg" className="w-48">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-48">
              Create Account
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 text-left">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">For Landlords</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Manage properties and tenants</li>
              <li>• Track rent payments</li>
              <li>• Review KYC documents</li>
              <li>• Generate rent agreements</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">For Tenants</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Explore available properties</li>
              <li>• View payment history</li>
              <li>• Upload documents</li>
              <li>• Access rent agreements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
