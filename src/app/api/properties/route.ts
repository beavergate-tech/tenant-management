import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const propertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  type: z.enum(["APARTMENT", "HOUSE", "CONDO", "STUDIO", "ROOM"]),
  size: z.number().positive().optional().nullable(),
  bedrooms: z.number().int().nonnegative().optional().nullable(),
  bathrooms: z.number().int().nonnegative().optional().nullable(),
  rentAmount: z.number().positive("Rent amount must be greater than 0"),
  deposit: z.number().nonnegative().optional().nullable(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
})

// GET /api/properties - Get all properties for landlord or available properties for tenant
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    let properties

    if (session.user.role === "LANDLORD") {
      // Get landlord's profile
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
      const where: Record<string, unknown> = {
        landlordId: landlordProfile.id,
      }

      if (status) where.status = status
      if (type) where.type = type
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ]
      }

      properties = await prisma.property.findMany({
        where,
        orderBy: { createdAt: "desc" },
      })
    } else {
      // Tenant: only show available properties
      const where: Record<string, unknown> = {
        status: "AVAILABLE",
      }

      if (type) where.type = type
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ]
      }

      properties = await prisma.property.findMany({
        where,
        orderBy: { createdAt: "desc" },
      })
    }

    return NextResponse.json({ properties })
  } catch {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/properties - Create new property (Landlord only)
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Creating property with data:", JSON.stringify(body, null, 2))
    const validatedData = propertySchema.parse(body)

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

    // Create property
    const property = await prisma.property.create({
      data: {
        ...validatedData,
        landlordId: landlordProfile.id,
        status: validatedData.status || "AVAILABLE",
      },
    })

    return NextResponse.json(
      { message: "Property created successfully", property },
      { status: 201 }
    )
  } catch {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return NextResponse.json(
        { error: firstError?.message || "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating property:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
