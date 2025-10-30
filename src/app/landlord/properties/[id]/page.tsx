"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useGetProperty, useDeleteProperty, type Property } from "@/hooks/property"
import { toast } from "sonner"
import { ArrowLeft, Edit, Trash2, MapPin, Home, Bed, Bath, Square } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const [getProperty, { isLoading }] = useGetProperty()
  const [deleteProperty, { isLoading: isDeleting }] = useDeleteProperty()
  const [property, setProperty] = useState<Property | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const loadProperty = async () => {
    try {
      const result = await getProperty(propertyId)
      setProperty(result.property)
      setHasLoaded(true)
    } catch (err) {
      toast.error("Failed to load property")
      router.push("/landlord/properties")
    }
  }

  if (!hasLoaded && !isLoading) {
    loadProperty()
  }

  const handleDelete = async () => {
    try {
      await deleteProperty(propertyId)
      toast.success("Property deleted successfully")
      router.push("/landlord/properties")
    } catch (err) {
      toast.error("Failed to delete property")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800"
      case "OCCUPIED":
        return "bg-blue-100 text-blue-800"
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading || !property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading property...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/landlord/properties">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{property.name}</h1>
            <p className="text-gray-600 mt-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              {property.address}, {property.city}, {property.state} {property.zipCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/landlord/properties/${property.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Property Images */}
      <Card>
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
            {property.images[0] ? (
              <img
                src={property.images[0]}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Home className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Property Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold">{property.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                {property.size && (
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Size</p>
                      <p className="font-semibold">{property.size} sq ft</p>
                    </div>
                  </div>
                )}
                {property.bedrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Bedrooms</p>
                      <p className="font-semibold">{property.bedrooms}</p>
                    </div>
                  </div>
                )}
                {property.bathrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Bathrooms</p>
                      <p className="font-semibold">{property.bathrooms}</p>
                    </div>
                  </div>
                )}
              </div>

              {property.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-800">{property.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pricing & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Monthly Rent</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${property.rentAmount.toLocaleString()}
                </p>
              </div>
              {property.deposit !== null && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Security Deposit</p>
                    <p className="text-xl font-semibold">
                      ${property.deposit.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">
                  {new Date(property.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {new Date(property.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
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
