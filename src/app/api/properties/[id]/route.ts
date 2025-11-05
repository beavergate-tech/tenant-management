import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updatePropertySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  zipCode: z.string().min(1).optional(),
  type: z.enum(["APARTMENT", "HOUSE", "CONDO", "STUDIO", "ROOM"]).optional(),
  size: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  rentAmount: z.number().positive().optional(),
  deposit: z.number().nonnegative().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
})

// GET /api/properties/[id] - Get single property
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

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        landlord: {
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
    })

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      )
    }

    // Check authorization for landlord
    if (session.user.role === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (property.landlordId !== landlordProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (property.status !== "AVAILABLE") {
      // Tenants can only see available properties
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error("Error fetching property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/properties/[id] - Update property (Landlord only)
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
    const validatedData = updatePropertySchema.parse(body)

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

    // Check if property exists and belongs to landlord
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      )
    }

    if (existingProperty.landlordId !== landlordProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update property
    const property = await prisma.property.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({
      message: "Property updated successfully",
      property,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/properties/[id] - Delete property (Landlord only)
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

    // Check if property exists and belongs to landlord
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      )
    }

    if (existingProperty.landlordId !== landlordProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete property
    await prisma.property.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Property deleted successfully" })
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
