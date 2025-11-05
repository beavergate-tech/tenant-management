import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateDocumentSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
})

// GET /api/documents/[id] - Get single document
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            rentals: {
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    landlordId: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Verify access
    if (session.user.role === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!landlordProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Check if landlord owns property that tenant is renting
      const hasAccess = document.tenant.rentals.some(
        (rental) => rental.property.landlordId === landlordProfile.id
      )

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (session.user.role === "TENANT") {
      const tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tenantProfile || document.tenantId !== tenantProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/documents/[id] - Update document verification status (Landlord only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateDocumentSchema.parse(body)

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            rentals: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Verify landlord owns property that tenant is renting
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!landlordProfile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const hasAccess = existingDocument.tenant.rentals.some(
      (rental) => rental.property.landlordId === landlordProfile.id
    )

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update document
    const updateData: Record<string, unknown> = {
      status: validatedData.status,
    }

    if (validatedData.rejectionReason) {
      updateData.rejectionReason = validatedData.rejectionReason
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      message: "Document verification status updated",
      document,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }

    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
