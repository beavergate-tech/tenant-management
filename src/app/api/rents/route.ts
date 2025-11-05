import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/rents - Get all rent payments (Landlord only)
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const propertyId = searchParams.get("propertyId")
    const tenantId = searchParams.get("tenantId")

    // Get landlord profile
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!landlordProfile) {
      return NextResponse.json(
        { error: "Landlord profile not found" },
        { status: 404 }
      )
    }

    // Build filter
    const rentalFilter: Record<string, unknown> = {
      property: {
        landlordId: landlordProfile.id,
      },
    }

    if (propertyId) {
      rentalFilter.propertyId = propertyId
    }

    if (tenantId) {
      rentalFilter.tenantId = tenantId
    }

    const where: Record<string, unknown> = {
      rental: rentalFilter,
    }

    if (status) {
      where.status = status
    }

    const rentPayments = await prisma.rentPayment.findMany({
      where,
      include: {
        rental: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
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
      orderBy: { dueDate: "desc" },
    })

    // Calculate summary stats
    const summary = {
      totalDue: rentPayments
        .filter((p) => p.status === "PENDING" || p.status === "OVERDUE")
        .reduce((sum, p) => sum + Number(p.amount), 0),
      totalPaid: rentPayments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + Number(p.amount), 0),
      overdueCount: rentPayments.filter((p) => p.status === "OVERDUE").length,
      pendingCount: rentPayments.filter((p) => p.status === "PENDING").length,
    }

    return NextResponse.json({ rentPayments, summary })
  } catch (error) {
    console.error("Error fetching rent payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
