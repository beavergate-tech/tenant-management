"use client"

import { useState } from "react"

export type Property = {
  id: string
  name: string
  description: string | null
  address: string
  city: string
  state: string
  zipCode: string
  type: "APARTMENT" | "HOUSE" | "CONDO" | "STUDIO" | "ROOM"
  size: number | null
  bedrooms: number | null
  bathrooms: number | null
  rentAmount: number
  deposit: number | null
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"
  images: string[]
  amenities: string[]
  landlordId: string
  createdAt: string
  updatedAt: string
}

export type CreatePropertyInput = {
  name: string
  description?: string
  address: string
  city: string
  state: string
  zipCode: string
  type: "APARTMENT" | "HOUSE" | "CONDO" | "STUDIO" | "ROOM"
  size?: number
  bedrooms?: number
  bathrooms?: number
  rentAmount: number
  deposit?: number
  status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"
  images: string[]
  amenities: string[]
}

// Create Property Hook
export function useCreateProperty() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProperty = async (data: CreatePropertyInput) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create property")
      }

      setIsLoading(false)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      setIsLoading(false)
      throw err
    }
  }

  return [createProperty, { isLoading, error }] as const
}

// Get Properties Hook
export function useGetProperties() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getProperties = async (params?: {
    status?: string
    type?: string
    search?: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.status) queryParams.append("status", params.status)
      if (params?.type) queryParams.append("type", params.type)
      if (params?.search) queryParams.append("search", params.search)

      const response = await fetch(`/api/properties?${queryParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch properties")
      }

      setIsLoading(false)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      setIsLoading(false)
      throw err
    }
  }

  return [getProperties, { isLoading, error }] as const
}

// Get Property by ID Hook
export function useGetProperty() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getProperty = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/properties/${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch property")
      }

      setIsLoading(false)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      setIsLoading(false)
      throw err
    }
  }

  return [getProperty, { isLoading, error }] as const
}

// Update Property Hook
export function useUpdateProperty() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProperty = async (id: string, data: Partial<CreatePropertyInput>) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update property")
      }

      setIsLoading(false)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      setIsLoading(false)
      throw err
    }
  }

  return [updateProperty, { isLoading, error }] as const
}

// Delete Property Hook
export function useDeleteProperty() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteProperty = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete property")
      }

      setIsLoading(false)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      setIsLoading(false)
      throw err
    }
  }

  return [deleteProperty, { isLoading, error }] as const
}
