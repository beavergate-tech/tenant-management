import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/rentals - Get all rentals
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const where: Record<string, unknown> = {}

    if (session.user.role === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!landlordProfile) {
        return NextResponse.json(
          { error: "Landlord profile not found" },
          { status: 404 }
        )
      }

      where.property = {
        landlordId: landlordProfile.id,
      }
    } else if (session.user.role === "TENANT") {
      const tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tenantProfile) {
        return NextResponse.json(
          { error: "Tenant profile not found" },
          { status: 404 }
        )
      }

      where.tenantId = tenantProfile.id
    }

    const rentals = await prisma.rental.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
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
      orderBy: { startDate: "desc" },
    })

    return NextResponse.json({ rentals })
  } catch {
    console.error("Error fetching rentals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
