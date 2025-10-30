"use client"

import { useState } from "react"

export type RentAgreement = {
  id: string
  rentalId: string
  startDate: string
  endDate: string
  rentAmount: number
  securityDeposit: number
  terms: string
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED"
  templateVariables: Record<string, string>
  pdfUrl: string | null
  createdAt: string
  updatedAt: string
  rental: {
    id: string
    property: {
      id: string
      name: string
      address: string
      city: string
      state: string
      zipCode: string
      landlord: {
        id: string
        user: {
          name: string | null
          email: string
          phone: string | null
        }
      }
    }
    tenant: {
      id: string
      user: {
        name: string | null
        email: string
        phone: string | null
      }
    }
  }
}

export type CreateAgreementInput = {
  rentalId: string
  startDate: string
  endDate: string
  rentAmount: number
  securityDeposit: number
  terms: string
  templateVariables?: Record<string, string>
}

export type UpdateAgreementInput = {
  startDate?: string
  endDate?: string
  rentAmount?: number
  securityDeposit?: number
  terms?: string
  status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED"
  templateVariables?: Record<string, string>
}

// Get Agreements Hook
export function useGetAgreements() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAgreements = async (params?: {
    rentalId?: string
    status?: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.rentalId) queryParams.append("rentalId", params.rentalId)
      if (params?.status) queryParams.append("status", params.status)

      const response = await fetch(`/api/agreements?${queryParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch agreements")
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

  return [getAgreements, { isLoading, error }] as const
}

// Get Agreement by ID Hook
export function useGetAgreement() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAgreement = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/agreements/${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch agreement")
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

  return [getAgreement, { isLoading, error }] as const
}

// Create Agreement Hook
export function useCreateAgreement() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAgreement = async (data: CreateAgreementInput) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create agreement")
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

  return [createAgreement, { isLoading, error }] as const
}

// Update Agreement Hook
export function useUpdateAgreement() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAgreement = async (
    id: string,
    data: UpdateAgreementInput
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/agreements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update agreement")
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

  return [updateAgreement, { isLoading, error }] as const
}

// Delete Agreement Hook
export function useDeleteAgreement() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAgreement = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/agreements/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete agreement")
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

  return [deleteAgreement, { isLoading, error }] as const
}
