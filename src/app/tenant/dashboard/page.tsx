"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Home, DollarSign, Calendar, AlertCircle } from "lucide-react"

type DashboardData = {
  activeRentals: number
  totalPending: number
  upcomingPayments: number
  pendingDocuments: number
  recentRentals: Array<{
    id: string
    property: {
      name: string
      address: string
    }
    startDate: string
    endDate: string | null
    monthlyRent: number
    status: string
  }>
  recentPayments: Array<{
    id: string
    amount: number
    dueDate: string
    status: string
    rental: {
      property: {
        name: string
      }
    }
  }>
}

export default function TenantDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tenant/dashboard")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load dashboard data")
      }

      setData(result)
    } catch {
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>
      case "PAID":
        return <Badge className="bg-green-500">Paid</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "OVERDUE":
        return <Badge className="bg-red-500">Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">Loading dashboard...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-muted-foreground">
          Failed to load dashboard data
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your tenant dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeRentals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalPending)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.upcomingPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingDocuments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Rentals */}
        <Card>
          <CardHeader>
            <CardTitle>My Rentals</CardTitle>
            <CardDescription>Your current and recent rental properties</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentRentals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No rentals found
              </p>
            ) : (
              <div className="space-y-4">
                {data.recentRentals.map((rental) => (
                  <div
                    key={rental.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{rental.property.name}</h4>
                        {getStatusBadge(rental.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rental.property.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(rental.monthlyRent)}/month
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => router.push("/tenant/properties")}
            >
              Browse Properties
            </Button>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Your rent payment history</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payments found
              </p>
            ) : (
              <div className="space-y-4">
                {data.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">
                          {payment.rental.property.name}
                        </h4>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => router.push("/tenant/payments")}
            >
              View All Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
