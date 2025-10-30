import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  occupation: z.string().optional(),
})

// GET /api/tenants/[id] - Get single tenant
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const tenant = await prisma.tenantProfile.findUnique({
      where: { id },
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
                city: true,
                state: true,
                rentAmount: true,
              },
            },
            rentPayments: {
              orderBy: { dueDate: "desc" },
              take: 10,
            },
          },
        },
        documents: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Verify landlord has access to this tenant
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: session.user.id },
    })

    const hasAccess = tenant.rentals.some(
      (rental) => rental.property && rental.property
    )

    if (!hasAccess && landlordProfile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ tenant })
  } catch {
    console.error("Error fetching tenant:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/tenants/[id] - Update tenant
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
    const validatedData = updateTenantSchema.parse(body)

    // Check if tenant exists
    const existingTenant = await prisma.tenantProfile.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!existingTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Update tenant profile and user name if provided
    const updateData: Record<string, unknown> = {}
    if (validatedData.phoneNumber !== undefined)
      updateData.phoneNumber = validatedData.phoneNumber
    if (validatedData.dateOfBirth !== undefined)
      updateData.dateOfBirth = validatedData.dateOfBirth
        ? new Date(validatedData.dateOfBirth)
        : null
    if (validatedData.occupation !== undefined)
      updateData.occupation = validatedData.occupation

    const tenant = await prisma.tenantProfile.update({
      where: { id },
      data: updateData,
    })

    // Update user name if provided
    if (validatedData.name) {
      await prisma.user.update({
        where: { id: existingTenant.userId },
        data: { name: validatedData.name },
      })
    }

    return NextResponse.json({
      message: "Tenant updated successfully",
      tenant,
    })
  } catch {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating tenant:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[id] - Delete tenant
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

    // Check if tenant has active rentals
    const activeRentals = await prisma.rental.count({
      where: {
        tenantId: id,
        status: "ACTIVE",
      },
    })

    if (activeRentals > 0) {
      return NextResponse.json(
        { error: "Cannot delete tenant with active rentals" },
        { status: 400 }
      )
    }

    // Delete tenant profile (will cascade to related data)
    await prisma.tenantProfile.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Tenant deleted successfully" })
  } catch {
    console.error("Error deleting tenant:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
