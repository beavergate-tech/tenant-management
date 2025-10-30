import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, DollarSign, FileCheck } from "lucide-react";

export default async function LandlordDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // Get landlord profile
  const landlordProfile = await prisma.landlordProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!landlordProfile) {
    return <div>Landlord profile not found</div>;
  }

  // Get statistics
  const [
    totalProperties,
    occupiedProperties,
    totalTenants,
    pendingKYC,
    recentPayments,
  ] = await Promise.all([
    prisma.property.count({
      where: { landlordId: landlordProfile.id },
    }),
    prisma.property.count({
      where: { landlordId: landlordProfile.id, status: "OCCUPIED" },
    }),
    prisma.rental.count({
      where: {
        property: { landlordId: landlordProfile.id },
        status: "ACTIVE",
      },
    }),
    prisma.document.count({
      where: {
        status: "PENDING",
        tenant: {
          rentals: {
            some: {
              property: { landlordId: landlordProfile.id },
            },
          },
        },
      },
    }),
    prisma.rentPayment.findMany({
      where: {
        rental: {
          property: { landlordId: landlordProfile.id },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        rental: {
          include: {
            tenant: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const availableProperties = totalProperties - occupiedProperties;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s an overview of your properties and tenants.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-gray-600 mt-1">
              {availableProperties} available, {occupiedProperties} occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Tenants
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <p className="text-xs text-gray-600 mt-1">Currently renting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPayments.length}</div>
            <p className="text-xs text-gray-600 mt-1">Last 5 transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <FileCheck className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingKYC}</div>
            <p className="text-xs text-gray-600 mt-1">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-gray-600 text-sm">No recent payments</p>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {payment.rental.tenant.user.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {payment.rental.property.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {payment.status === "PAID" ? (
                        <span className="text-green-600">Paid</span>
                      ) : payment.status === "PENDING" ? (
                        <span className="text-yellow-600">Pending</span>
                      ) : (
                        <span className="text-red-600">Overdue</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
