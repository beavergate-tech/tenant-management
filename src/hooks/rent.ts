"use client"

import { useState } from "react"

export type RentPayment = {
  id: string
  rentalId: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: "PENDING" | "PAID" | "OVERDUE"
  paymentMethod: string | null
  transactionId: string | null
  rental: {
    id: string
    property: {
      id: string
      name: string
      address: string
    }
    tenant: {
      id: string
      user: {
        name: string | null
        email: string
      }
    }
  }
  createdAt: string
  updatedAt: string
}

export type UpdateRentPaymentInput = {
  status?: "PENDING" | "PAID" | "OVERDUE"
  paidDate?: string
  paymentMethod?: string
  transactionId?: string
}

export type RentSummary = {
  totalDue: number
  totalPaid: number
  overdueCount: number
  pendingCount: number
}

// Get Rent Payments Hook
export function useGetRentPayments() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRentPayments = async (params?: {
    status?: string
    propertyId?: string
    tenantId?: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.status) queryParams.append("status", params.status)
      if (params?.propertyId) queryParams.append("propertyId", params.propertyId)
      if (params?.tenantId) queryParams.append("tenantId", params.tenantId)

      const response = await fetch(`/api/rents?${queryParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch rent payments")
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

  return [getRentPayments, { isLoading, error }] as const
}

// Get Rent Payment by ID Hook
export function useGetRentPayment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRentPayment = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/rents/${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch rent payment")
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

  return [getRentPayment, { isLoading, error }] as const
}

// Update Rent Payment Hook
export function useUpdateRentPayment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRentPayment = async (
    id: string,
    data: UpdateRentPaymentInput
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/rents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update rent payment")
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

  return [updateRentPayment, { isLoading, error }] as const
}
