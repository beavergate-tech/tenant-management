import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/documents - Get all KYC documents (Landlord only)
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const tenantId = searchParams.get("tenantId")
    const type = searchParams.get("type")

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

    // Build filter - get documents from tenants renting landlord's properties
    const where: Record<string, unknown> = {
      tenant: {
        rentals: {
          some: {
            property: {
              landlordId: landlordProfile.id,
            },
          },
        },
      },
    }

    if (status) {
      where.status = status
    }

    if (tenantId) {
      where.tenantId = tenantId
    }

    if (type) {
      where.type = type
    }

    const documents = await prisma.document.findMany({
      where,
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
                    name: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate summary stats
    const summary = {
      pendingCount: documents.filter((d) => d.status === "PENDING").length,
      approvedCount: documents.filter((d) => d.status === "APPROVED").length,
      rejectedCount: documents.filter((d) => d.status === "REJECTED").length,
      totalCount: documents.length,
    }

    return NextResponse.json({ documents, summary })
  } catch {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
