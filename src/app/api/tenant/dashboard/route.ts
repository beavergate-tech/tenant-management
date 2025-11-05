import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/tenant/dashboard - Get tenant dashboard data
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "TENANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get tenant profile
    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!tenantProfile) {
      return NextResponse.json(
        { error: "Tenant profile not found" },
        { status: 404 }
      )
    }

    // Get active rentals count
    const activeRentals = await prisma.rental.count({
      where: {
        tenantId: tenantProfile.id,
        status: "ACTIVE",
      },
    })

    // Get pending payments
    const pendingPayments = await prisma.rentPayment.findMany({
      where: {
        rental: {
          tenantId: tenantProfile.id,
        },
        status: {
          in: ["PENDING", "OVERDUE"],
        },
      },
    })

    const totalPending = pendingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    )

    const upcomingPayments = pendingPayments.length

    // Get pending documents count
    const pendingDocuments = await prisma.document.count({
      where: {
        tenantId: tenantProfile.id,
        status: "PENDING",
      },
    })

    // Get recent rentals
    const recentRentals = await prisma.rental.findMany({
      where: {
        tenantId: tenantProfile.id,
      },
      include: {
        property: {
          select: {
            name: true,
            address: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
      take: 5,
    })

    // Get recent payments
    const recentPayments = await prisma.rentPayment.findMany({
      where: {
        rental: {
          tenantId: tenantProfile.id,
        },
      },
      include: {
        rental: {
          include: {
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: "desc" },
      take: 5,
    })

    return NextResponse.json({
      activeRentals,
      totalPending,
      upcomingPayments,
      pendingDocuments,
      recentRentals,
      recentPayments,
    })
  } catch (error) {
    console.error("Error fetching tenant dashboard:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
