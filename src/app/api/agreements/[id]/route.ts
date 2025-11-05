import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateAgreementSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rentAmount: z.number().positive().optional(),
  securityDeposit: z.number().nonnegative().optional(),
  terms: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]).optional(),
  templateVariables: z.record(z.string(), z.string()).optional(),
})

// GET /api/agreements/[id] - Get single agreement
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

    const agreement = await prisma.rentAgreement.findUnique({
      where: { id },
      include: {
        rental: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                landlord: {
                  select: {
                    id: true,
                    phoneNumber: true,
                    user: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
            tenant: {
              select: {
                id: true,
                phoneNumber: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      )
    }

    // Verify access
    if (session.user.role === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (
        !landlordProfile ||
        !agreement.rental ||
        agreement.rental.property.landlord.id !== landlordProfile.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (session.user.role === "TENANT") {
      const tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (
        !tenantProfile ||
        !agreement.rental ||
        agreement.rental.tenantId !== tenantProfile.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json({ agreement })
  } catch (error) {
    console.error("Error fetching agreement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/agreements/[id] - Update agreement (Landlord only)
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
    const validatedData = updateAgreementSchema.parse(body)

    // Check if agreement exists
    const existingAgreement = await prisma.rentAgreement.findUnique({
      where: { id },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    })

    if (!existingAgreement) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      )
    }

    // Verify landlord owns the property
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (
      !landlordProfile ||
      !existingAgreement.rental ||
      existingAgreement.rental.property.landlordId !== landlordProfile.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (validatedData.startDate !== undefined)
      updateData.startDate = new Date(validatedData.startDate)
    if (validatedData.endDate !== undefined)
      updateData.endDate = new Date(validatedData.endDate)
    if (validatedData.rentAmount !== undefined)
      updateData.rentAmount = validatedData.rentAmount
    if (validatedData.securityDeposit !== undefined)
      updateData.securityDeposit = validatedData.securityDeposit
    if (validatedData.terms !== undefined)
      updateData.terms = validatedData.terms
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status
    if (validatedData.templateVariables !== undefined)
      updateData.templateVariables = validatedData.templateVariables

    const agreement = await prisma.rentAgreement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      message: "Agreement updated successfully",
      agreement,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }

    console.error("Error updating agreement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/agreements/[id] - Delete agreement (Landlord only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if agreement exists
    const existingAgreement = await prisma.rentAgreement.findUnique({
      where: { id },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    })

    if (!existingAgreement) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      )
    }

    // Verify landlord owns the property
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (
      !landlordProfile ||
      !existingAgreement.rental ||
      existingAgreement.rental.property.landlordId !== landlordProfile.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only allow deletion of DRAFT agreements
    if (existingAgreement.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot delete active or terminated agreements" },
        { status: 400 }
      )
    }

    await prisma.rentAgreement.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Agreement deleted successfully" })
  } catch (error) {
    console.error("Error deleting agreement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
