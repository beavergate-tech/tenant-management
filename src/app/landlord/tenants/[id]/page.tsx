"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useGetTenant, useDeleteTenant, type Tenant } from "@/hooks/tenant"
import { toast } from "sonner"
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, Trash2, FileText, DollarSign } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [getTenant, { isLoading }] = useGetTenant()
  const [deleteTenant, { isLoading: isDeleting }] = useDeleteTenant()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const loadTenant = async () => {
    try {
      const result = await getTenant(tenantId)
      setTenant(result.tenant)
      setHasLoaded(true)
    } catch {
      toast.error("Failed to load tenant")
      router.push("/landlord/tenants")
    }
  }

  if (!hasLoaded && !isLoading) {
    loadTenant()
  }

  const handleDelete = async () => {
    try {
      await deleteTenant(tenantId)
      toast.success("Tenant deleted successfully")
      router.push("/landlord/tenants")
    } catch {
      toast.error("Failed to delete tenant. They may have active rentals.")
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

  const getDocumentBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  if (isLoading || !tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading tenant...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/landlord/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{tenant.user.name}</h1>
            <p className="text-gray-600 mt-1">Tenant Profile</p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tenant Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {getKYCBadge(tenant.kycStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{tenant.user.email}</p>
                  </div>
                </div>
                {tenant.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{tenant.phoneNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              {(tenant.occupation || tenant.dateOfBirth) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {tenant.occupation && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Occupation</p>
                          <p className="font-medium">{tenant.occupation}</p>
                        </div>
                      </div>
                    )}
                    {tenant.dateOfBirth && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Date of Birth</p>
                          <p className="font-medium">
                            {new Date(tenant.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Rentals */}
          <Card>
            <CardHeader>
              <CardTitle>Rentals</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.rentals.length === 0 ? (
                <p className="text-sm text-gray-600">No active rentals</p>
              ) : (
                <div className="space-y-4">
                  {tenant.rentals.map((rental) => (
                    <div
                      key={rental.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <Link
                          href={`/landlord/properties/${rental.property.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {rental.property.name}
                        </Link>
                        <p className="text-sm text-gray-600">
                          {rental.property.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${rental.monthlyRent.toFixed(2)}/mo</p>
                        <Badge variant="outline">{rental.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>KYC Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.documents.length === 0 ? (
                <p className="text-sm text-gray-600">No documents uploaded</p>
              ) : (
                <div className="space-y-3">
                  {tenant.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium text-sm">{doc.fileName}</p>
                          <p className="text-xs text-gray-600">
                            {doc.type.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      {getDocumentBadge(doc.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {new Date(tenant.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/landlord/kyc">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Documents
                </Button>
              </Link>
              <Link href="/landlord/rents">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Payments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant? This action cannot be undone.
              Tenants with active rentals cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
