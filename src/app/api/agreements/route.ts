import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const createAgreementSchema = z.object({
  rentalId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  rentAmount: z.number().positive(),
  securityDeposit: z.number().nonnegative(),
  terms: z.string(),
  templateVariables: z.record(z.string()).optional(),
})

// GET /api/agreements - Get all rent agreements
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rentalId = searchParams.get("rentalId")
    const status = searchParams.get("status")

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

      where.rental = {
        property: {
          landlordId: landlordProfile.id,
        },
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

      where.rental = {
        tenantId: tenantProfile.id,
      }
    }

    if (rentalId) {
      where.rentalId = rentalId
    }

    if (status) {
      where.status = status
    }

    const agreements = await prisma.rentAgreement.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ agreements })
  } catch {
    console.error("Error fetching agreements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/agreements - Create rent agreement (Landlord only)
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAgreementSchema.parse(body)

    // Verify rental exists and belongs to landlord
    const rental = await prisma.rental.findUnique({
      where: { id: validatedData.rentalId },
      include: {
        property: true,
      },
    })

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 })
    }

    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!landlordProfile || rental.property.landlordId !== landlordProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create agreement
    const agreement = await prisma.rentAgreement.create({
      data: {
        rentalId: validatedData.rentalId,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        rentAmount: validatedData.rentAmount,
        securityDeposit: validatedData.securityDeposit,
        terms: validatedData.terms,
        templateVariables: validatedData.templateVariables || {},
        status: "DRAFT",
      },
    })

    return NextResponse.json(
      { message: "Agreement created successfully", agreement },
      { status: 201 }
    )
  } catch {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation error" },
        { status: 400 }
      )
    }

    console.error("Error creating agreement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
