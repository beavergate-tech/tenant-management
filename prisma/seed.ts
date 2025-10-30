import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Landlord User
  const landlordPassword = await bcrypt.hash('landlord123', 10)
  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@example.com' },
    update: {},
    create: {
      email: 'landlord@example.com',
      name: 'John Landlord',
      password: landlordPassword,
      role: 'LANDLORD',
      emailVerified: new Date(),
      landlordProfile: {
        create: {
          phoneNumber: '+1234567890',
          businessName: 'Premium Properties LLC',
        },
      },
    },
  })

  console.log('✅ Created landlord user:', landlord.email)

  // Create Tenant Users
  const tenantPassword = await bcrypt.hash('tenant123', 10)
  const tenant1 = await prisma.user.upsert({
    where: { email: 'tenant1@example.com' },
    update: {},
    create: {
      email: 'tenant1@example.com',
      name: 'Alice Tenant',
      password: tenantPassword,
      role: 'TENANT',
      emailVerified: new Date(),
      tenantProfile: {
        create: {
          phoneNumber: '+1234567891',
          dateOfBirth: new Date('1990-05-15'),
          occupation: 'Software Engineer',
          kycStatus: 'APPROVED',
        },
      },
    },
  })

  const tenant2 = await prisma.user.upsert({
    where: { email: 'tenant2@example.com' },
    update: {},
    create: {
      email: 'tenant2@example.com',
      name: 'Bob Renter',
      password: tenantPassword,
      role: 'TENANT',
      emailVerified: new Date(),
      tenantProfile: {
        create: {
          phoneNumber: '+1234567892',
          dateOfBirth: new Date('1988-08-22'),
          occupation: 'Marketing Manager',
          kycStatus: 'PENDING',
        },
      },
    },
  })

  console.log('✅ Created tenant users:', tenant1.email, tenant2.email)

  // Get landlord profile
  const landlordProfile = await prisma.landlordProfile.findUnique({
    where: { userId: landlord.id },
  })

  if (!landlordProfile) {
    throw new Error('Landlord profile not found')
  }

  // Create Properties
  const property1 = await prisma.property.create({
    data: {
      name: 'Sunset Apartment',
      description: 'Beautiful 2-bedroom apartment with stunning sunset views. Modern amenities and centrally located.',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'California',
      zipCode: '94102',
      type: 'APARTMENT',
      size: 1200,
      bedrooms: 2,
      bathrooms: 2,
      rentAmount: 2500,
      deposit: 5000,
      status: 'OCCUPIED',
      images: [
        '/placeholder-property-1.jpg',
        '/placeholder-property-2.jpg',
      ],
      amenities: ['Parking', 'Gym', 'Pool', 'Pet Friendly', 'Air Conditioning'],
      landlordId: landlordProfile.id,
    },
  })

  const property2 = await prisma.property.create({
    data: {
      name: 'Downtown Studio',
      description: 'Cozy studio in the heart of downtown. Perfect for young professionals.',
      address: '456 Market Street',
      city: 'San Francisco',
      state: 'California',
      zipCode: '94103',
      type: 'STUDIO',
      size: 500,
      bedrooms: 0,
      bathrooms: 1,
      rentAmount: 1800,
      deposit: 3600,
      status: 'AVAILABLE',
      images: ['/placeholder-studio.jpg'],
      amenities: ['Heating', 'Internet', 'Security'],
      landlordId: landlordProfile.id,
    },
  })

  const property3 = await prisma.property.create({
    data: {
      name: 'Luxury Villa',
      description: 'Spacious 4-bedroom villa with garden and garage. Family-friendly neighborhood.',
      address: '789 Oak Avenue',
      city: 'Palo Alto',
      state: 'California',
      zipCode: '94301',
      type: 'HOUSE',
      size: 3000,
      bedrooms: 4,
      bathrooms: 3,
      rentAmount: 5000,
      deposit: 10000,
      status: 'AVAILABLE',
      images: [
        '/placeholder-house-1.jpg',
        '/placeholder-house-2.jpg',
        '/placeholder-house-3.jpg',
      ],
      amenities: ['Parking', 'Garden', 'Garage', 'Pet Friendly', 'Air Conditioning', 'Heating'],
      landlordId: landlordProfile.id,
    },
  })

  console.log('✅ Created properties:', property1.name, property2.name, property3.name)

  // Get tenant profiles
  const tenantProfile1 = await prisma.tenantProfile.findUnique({
    where: { userId: tenant1.id },
  })

  if (!tenantProfile1) {
    throw new Error('Tenant profile 1 not found')
  }

  // Create Rental for Property 1
  const rental1 = await prisma.rental.create({
    data: {
      propertyId: property1.id,
      tenantId: tenantProfile1.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      monthlyRent: 2500,
      deposit: 5000,
      status: 'ACTIVE',
    },
  })

  console.log('✅ Created rental:', rental1.id)

  // Create Rent Payments
  const payment1 = await prisma.rentPayment.create({
    data: {
      rentalId: rental1.id,
      amount: 2500,
      dueDate: new Date('2024-10-01'),
      paidDate: new Date('2024-09-28'),
      status: 'PAID',
    },
  })

  const payment2 = await prisma.rentPayment.create({
    data: {
      rentalId: rental1.id,
      amount: 2500,
      dueDate: new Date('2024-11-01'),
      status: 'PENDING',
    },
  })

  console.log('✅ Created rent payments:', payment1.id, payment2.id)

  // Create Documents
  const document1 = await prisma.document.create({
    data: {
      tenantId: tenantProfile1.id,
      type: 'ID_PROOF',
      fileName: 'drivers_license.pdf',
      fileUrl: '/documents/sample-id.pdf',
      fileSize: 1024000,
      status: 'APPROVED',
    },
  })

  console.log('✅ Created documents:', document1.id)

  // Create Rent Agreement
  const agreement1 = await prisma.rentAgreement.create({
    data: {
      propertyId: property1.id,
      templateName: 'Standard Residential Lease',
      content: 'This Rental Agreement is entered into on {{agreementDate}} between:\n\n' +
        'LANDLORD: {{landlordName}}\n' +
        'TENANT: {{tenantName}}\n\n' +
        'PROPERTY: {{propertyAddress}}\n\n' +
        'TERMS:\n' +
        '1. Monthly Rent: ${{rentAmount}}\n' +
        '2. Security Deposit: ${{depositAmount}}\n' +
        '3. Lease Term: {{leaseStartDate}} to {{leaseEndDate}}\n\n' +
        'The tenant agrees to pay rent on the first day of each month.\n\n' +
        'LANDLORD SIGNATURE: _________________\n' +
        'TENANT SIGNATURE: _________________',
      variables: {
        agreementDate: new Date('2024-01-01').toISOString(),
        landlordName: 'John Landlord',
        tenantName: 'Alice Tenant',
        propertyAddress: '123 Main Street, San Francisco, CA 94102',
        rentAmount: '2500',
        depositAmount: '5000',
        leaseStartDate: '2024-01-01',
        leaseEndDate: '2025-01-01',
      },
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      version: 1,
    },
  })

  console.log('✅ Created rent agreement:', agreement1.id)

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
