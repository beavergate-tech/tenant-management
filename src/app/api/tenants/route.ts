import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const createTenantSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  occupation: z.string().optional(),
})

// GET /api/tenants - Get all tenants (Landlord only)
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const kycStatus = searchParams.get("kycStatus")

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

    // Build filter - get tenants who have rented from this landlord
    const where: Record<string, unknown> = {
      rentals: {
        some: {
          property: {
            landlordId: landlordProfile.id,
          },
        },
      },
    }

    if (kycStatus) {
      where.kycStatus = kycStatus
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const tenants = await prisma.tenantProfile.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        rentals: {
          where: {
            property: {
              landlordId: landlordProfile.id,
            },
          },
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error("Error fetching tenants:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tenants - Create/Invite tenant (Landlord only)
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTenantSchema.parse(body)

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (user) {
      // User exists, check if they have a tenant profile
      const existingTenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: user.id },
      })

      if (existingTenantProfile) {
        return NextResponse.json(
          {
            message: "Tenant already exists",
            tenant: existingTenantProfile,
          },
          { status: 200 }
        )
      }

      // Create tenant profile for existing user
      const tenantProfile = await prisma.tenantProfile.create({
        data: {
          userId: user.id,
          phoneNumber: validatedData.phoneNumber,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
          occupation: validatedData.occupation,
        },
      })

      return NextResponse.json(
        {
          message: "Tenant profile created successfully",
          tenant: tenantProfile,
        },
        { status: 201 }
      )
    }

    // Create new user with tenant profile
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: "TENANT",
        tenantProfile: {
          create: {
            phoneNumber: validatedData.phoneNumber,
            dateOfBirth: validatedData.dateOfBirth
              ? new Date(validatedData.dateOfBirth)
              : null,
            occupation: validatedData.occupation,
          },
        },
      },
      include: {
        tenantProfile: true,
      },
    })

    // TODO: Send invitation email with temporary password

    return NextResponse.json(
      {
        message: "Tenant created successfully",
        tenant: newUser.tenantProfile,
        tempPassword, // Remove this in production, send via email only
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating tenant:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
