"use client"

import { useState } from "react"

export type Document = {
  id: string
  tenantId: string
  type: string
  fileName: string
  fileUrl: string
  fileSize: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  tenant: {
    id: string
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
    }>
  }
}

export type DocumentSummary = {
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  totalCount: number
}

export type UpdateDocumentInput = {
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason?: string
}

// Get Documents Hook
export function useGetDocuments() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getDocuments = async (params?: {
    status?: string
    tenantId?: string
    type?: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (params?.status) queryParams.append("status", params.status)
      if (params?.tenantId) queryParams.append("tenantId", params.tenantId)
      if (params?.type) queryParams.append("type", params.type)

      const response = await fetch(`/api/documents?${queryParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch documents")
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

  return [getDocuments, { isLoading, error }] as const
}

// Get Document by ID Hook
export function useGetDocument() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getDocument = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/documents/${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch document")
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

  return [getDocument, { isLoading, error }] as const
}

// Update Document Hook
export function useUpdateDocument() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateDocument = async (
    id: string,
    data: UpdateDocumentInput
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update document")
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

  return [updateDocument, { isLoading, error }] as const
}
