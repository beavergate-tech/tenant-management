"use client"

import { useState } from "react"

export type Tenant = {
  id: string
  userId: string
  phoneNumber: string | null
  dateOfBirth: string | null
  occupation: string | null
  kycStatus: "PENDING" | "APPROVED" | "REJECTED"
  user: {
    name: string | null
    email: string
  }
  rentals: Array<{
    id: string
    property: {
      id: string
      name: string
      address: string
    }
    monthlyRent: number
    status: string
  }>
  documents: Array<{
    id: string
    type: string
    fileName: string
    status: string
  }>
  createdAt: string
  updatedAt: string
}

export type CreateTenantInput = {
  email: string
  name: string
  phoneNumber?: string
  dateOfBirth?: string
  occupation?: string
}

// Get Tenants Hook
export function useGetTenants() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTenants = async (params?: { search?: string; kycStatus?: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append("search", params.search)
      if (params?.kycStatus) queryParams.append("kycStatus", params.kycStatus)

      const response = await fetch(`/api/tenants?${queryParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch tenants")
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

  return [getTenants, { isLoading, error }] as const
}

// Get Tenant by ID Hook
export function useGetTenant() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTenant = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tenants/${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch tenant")
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

  return [getTenant, { isLoading, error }] as const
}

// Create Tenant Hook (Invite)
export function useCreateTenant() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTenant = async (data: CreateTenantInput) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create tenant")
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

  return [createTenant, { isLoading, error }] as const
}

// Update Tenant Hook
export function useUpdateTenant() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTenant = async (id: string, data: Partial<CreateTenantInput>) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update tenant")
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

  return [updateTenant, { isLoading, error }] as const
}

// Delete Tenant Hook
export function useDeleteTenant() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTenant = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tenants/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete tenant")
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

  return [deleteTenant, { isLoading, error }] as const
}
