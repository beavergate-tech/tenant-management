"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Search, MapPin, Bed, Bath, Home, User, Phone } from "lucide-react"

type Property = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  type: string
  bedrooms: number
  bathrooms: number
  area: number
  rent: number
  description: string | null
  amenities: string[]
  status: string
  landlord: {
    user: {
      name: string | null
      phone: string | null
    }
  }
}

export default function TenantPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [cityFilter, setCityFilter] = useState<string>("all")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all")
  const [bedroomsFilter, setBedroomsFilter] = useState<string>("all")

  const loadProperties = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (cityFilter !== "all") params.append("city", cityFilter)
      if (propertyTypeFilter !== "all") params.append("propertyType", propertyTypeFilter)
      if (bedroomsFilter !== "all") params.append("bedrooms", bedroomsFilter)

      const response = await fetch(`/api/properties/available?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load properties")
      }

      setProperties(result.properties)
    } catch {
      toast.error("Failed to load properties")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProperties()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityFilter, propertyTypeFilter, bedroomsFilter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const uniqueCities = Array.from(new Set(properties.map((p) => p.city)))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Properties</h1>
        <p className="text-muted-foreground">Find your next rental home</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties by name, address or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadProperties()
                  }
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="APARTMENT">Apartment</SelectItem>
                  <SelectItem value="HOUSE">House</SelectItem>
                  <SelectItem value="CONDO">Condo</SelectItem>
                  <SelectItem value="VILLA">Villa</SelectItem>
                  <SelectItem value="STUDIO">Studio</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Bedrooms</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadProperties}>Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No properties found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.city}, {property.state}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{property.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {property.address}
                </p>

                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    {property.bedrooms} Bed
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    {property.bathrooms} Bath
                  </div>
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    {property.area} sqft
                  </div>
                </div>

                {property.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {property.description}
                  </p>
                )}

                {property.amenities && property.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{property.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(property.rent)}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </div>

                {property.landlord.user.name && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Owner: {property.landlord.user.name}
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                {property.landlord.user.phone && (
                  <Button variant="outline" className="flex-1" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                )}
                <Button className="flex-1" size="sm">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
