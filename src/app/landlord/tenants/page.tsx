"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetTenants, type Tenant } from "@/hooks/tenant"
import { Plus, Search, Users, Mail, Phone } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useCreateTenant } from "@/hooks/tenant"

export default function TenantsPage() {
  const [getTenants, { isLoading }] = useGetTenants()
  const [createTenant, { isLoading: isCreating }] = useCreateTenant()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [search, setSearch] = useState("")
  const [kycFilter, setKycFilter] = useState<string>("ALL")
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    occupation: "",
  })

  const loadTenants = async () => {
    try {
      const params: any = {}
      if (kycFilter !== "ALL") params.kycStatus = kycFilter
      if (search) params.search = search

      const result = await getTenants(params)
      setTenants(result.tenants)
      setHasLoaded(true)
    } catch (err) {
      toast.error("Failed to load tenants")
    }
  }

  if (!hasLoaded && !isLoading) {
    loadTenants()
  }

  const handleSearch = () => {
    loadTenants()
  }

  const handleFilterChange = () => {
    loadTenants()
  }

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTenant(formData)
      toast.success("Tenant added successfully!")
      setShowAddDialog(false)
      setFormData({ name: "", email: "", phoneNumber: "", occupation: "" })
      loadTenants()
    } catch (error) {
      toast.error("Failed to add tenant")
    }
  }

  const getKYCBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-gray-600 mt-1">Manage your tenants</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddTenant}>
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription>
                  Enter the tenant's details to create an account or invite them.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Adding..." : "Add Tenant"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </div>
            <Select
              value={kycFilter}
              onValueChange={(value) => {
                setKycFilter(value)
                setTimeout(handleFilterChange, 0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading tenants...</p>
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
            <p className="text-gray-600 mb-4">
              Add your first tenant to get started
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Link key={tenant.id} href={`/landlord/tenants/${tenant.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{tenant.user.name}</CardTitle>
                    {getKYCBadge(tenant.kycStatus)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {tenant.user.email}
                  </div>
                  {tenant.phoneNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {tenant.phoneNumber}
                    </div>
                  )}
                  {tenant.occupation && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Occupation:</span> {tenant.occupation}
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      {tenant.rentals.length} rental{tenant.rentals.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
