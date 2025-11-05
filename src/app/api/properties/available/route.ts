import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/properties/available - Get available properties for tenants
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const city = searchParams.get("city")
    const state = searchParams.get("state")
    const propertyType = searchParams.get("propertyType")
    const minRent = searchParams.get("minRent")
    const maxRent = searchParams.get("maxRent")
    const bedrooms = searchParams.get("bedrooms")

    // Build filter for available properties
    const where: Record<string, unknown> = {
      status: "AVAILABLE", // Only show available properties
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (city) {
      where.city = city
    }

    if (state) {
      where.state = state
    }

    if (propertyType) {
      where.type = propertyType
    }

    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms)
    }

    if (minRent || maxRent) {
      const rentFilter: { gte?: number; lte?: number } = {}
      if (minRent) rentFilter.gte = parseFloat(minRent)
      if (maxRent) rentFilter.lte = parseFloat(maxRent)
      where.rentAmount = rentFilter
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        landlord: {
          select: {
            id: true,
            phoneNumber: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ properties })
  } catch (error) {
    console.error("Error fetching available properties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
