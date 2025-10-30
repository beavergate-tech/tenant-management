"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetProperty, useUpdateProperty, type Property } from "@/hooks/property"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const [getProperty, { isLoading: isLoadingProperty }] = useGetProperty()
  const [updateProperty, { isLoading: isUpdating }] = useUpdateProperty()
  const [property, setProperty] = useState<Property | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [amenitiesInput, setAmenitiesInput] = useState("")

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

  if (!hasLoaded && !isLoadingProperty) {
    loadProperty()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property) return

    try {
      await updateProperty(propertyId, {
        name: property.name,
        description: property.description || undefined,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        type: property.type,
        size: property.size || undefined,
        bedrooms: property.bedrooms || undefined,
        bathrooms: property.bathrooms || undefined,
        rentAmount: property.rentAmount,
        deposit: property.deposit || undefined,
        status: property.status,
        images: property.images,
        amenities: property.amenities,
      })
      toast.success("Property updated successfully!")
      router.push(`/landlord/properties/${propertyId}`)
    } catch (error) {
      toast.error("Failed to update property")
    }
  }

  const handleAddAmenity = () => {
    if (amenitiesInput.trim() && property) {
      setProperty({
        ...property,
        amenities: [...property.amenities, amenitiesInput.trim()],
      })
      setAmenitiesInput("")
    }
  }

  const handleRemoveAmenity = (index: number) => {
    if (property) {
      setProperty({
        ...property,
        amenities: property.amenities.filter((_, i) => i !== index),
      })
    }
  }

  if (isLoadingProperty || !property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading property...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/landlord/properties/${propertyId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Property</h1>
          <p className="text-gray-600 mt-1">Update property details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  value={property.name}
                  onChange={(e) => setProperty({ ...property, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={property.description || ""}
                  onChange={(e) => setProperty({ ...property, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="type">Property Type *</Label>
                  <Select
                    value={property.type}
                    onValueChange={(value: any) => setProperty({ ...property, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APARTMENT">Apartment</SelectItem>
                      <SelectItem value="HOUSE">House</SelectItem>
                      <SelectItem value="CONDO">Condo</SelectItem>
                      <SelectItem value="STUDIO">Studio</SelectItem>
                      <SelectItem value="ROOM">Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={property.status}
                    onValueChange={(value: any) => setProperty({ ...property, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="OCCUPIED">Occupied</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={property.address}
                  onChange={(e) => setProperty({ ...property, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={property.city}
                    onChange={(e) => setProperty({ ...property, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={property.state}
                    onChange={(e) => setProperty({ ...property, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input
                    id="zipCode"
                    value={property.zipCode}
                    onChange={(e) => setProperty({ ...property, zipCode: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="size">Size (sq ft)</Label>
                  <Input
                    id="size"
                    type="number"
                    value={property.size || 0}
                    onChange={(e) => setProperty({ ...property, size: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={property.bedrooms || 0}
                    onChange={(e) => setProperty({ ...property, bedrooms: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={property.bathrooms || 0}
                    onChange={(e) => setProperty({ ...property, bathrooms: Number(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="rentAmount">Monthly Rent *</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    value={property.rentAmount}
                    onChange={(e) => setProperty({ ...property, rentAmount: Number(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">Security Deposit</Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={property.deposit || 0}
                    onChange={(e) => setProperty({ ...property, deposit: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  placeholder="Add amenity (e.g., Parking, Gym)"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAmenity())}
                />
                <Button type="button" onClick={handleAddAmenity}>
                  Add
                </Button>
              </div>
              {property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(index)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Property"}
            </Button>
            <Link href={`/landlord/properties/${propertyId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
