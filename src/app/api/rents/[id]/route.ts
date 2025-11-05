import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateRentPaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
  paidDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
})

// GET /api/rents/[id] - Get single rent payment
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

    const rentPayment = await prisma.rentPayment.findUnique({
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
                landlordId: true,
              },
            },
            tenant: {
              include: {
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

    if (!rentPayment) {
      return NextResponse.json(
        { error: "Rent payment not found" },
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
        rentPayment.rental.property.landlordId !== landlordProfile.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (session.user.role === "TENANT") {
      const tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tenantProfile || rentPayment.rental.tenantId !== tenantProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json({ rentPayment })
  } catch (error) {
    console.error("Error fetching rent payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/rents/[id] - Update rent payment (mark as paid, etc.)
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
    const validatedData = updateRentPaymentSchema.parse(body)

    // Check if rent payment exists
    const existingPayment = await prisma.rentPayment.findUnique({
      where: { id },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Rent payment not found" },
        { status: 404 }
      )
    }

    // Verify landlord owns the property
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (
      !landlordProfile ||
      existingPayment.rental.property.landlordId !== landlordProfile.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update payment
    const updateData: Record<string, unknown> = {}
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.paidDate !== undefined)
      updateData.paidDate = validatedData.paidDate ? new Date(validatedData.paidDate) : null
    if (validatedData.paymentMethod !== undefined)
      updateData.paymentMethod = validatedData.paymentMethod
    if (validatedData.transactionId !== undefined)
      updateData.transactionId = validatedData.transactionId

    const rentPayment = await prisma.rentPayment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      message: "Rent payment updated successfully",
      rentPayment,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }

    console.error("Error updating rent payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
