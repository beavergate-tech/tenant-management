"use client";

import { useEffect, useState } from "react";
import {
  useGetRentPayments,
  useUpdateRentPayment,
  type RentPayment,
  type RentSummary,
} from "@/hooks/rent";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function RentsPage() {
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [summary, setSummary] = useState<RentSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(
    null
  );
  const [markAsPaidDialog, setMarkAsPaidDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const [getRentPayments, { isLoading }] = useGetRentPayments();
  const [updateRentPayment, { isLoading: isUpdating }] = useUpdateRentPayment();

  useEffect(() => {
    const loadRentPayments = async () => {
      try {
        const params =
          statusFilter !== "all" ? { status: statusFilter } : undefined;
        const result = await getRentPayments(params);
        setRentPayments(result.rentPayments);
        setSummary(result.summary);
      } catch {
        toast.error("Failed to load rent payments");
      }
    };

    loadRentPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleMarkAsPaid = async () => {
    if (!selectedPayment) return;

    try {
      await updateRentPayment(selectedPayment.id, {
        status: "PAID",
        paidDate: new Date().toISOString(),
        paymentMethod,
        transactionId: transactionId || undefined,
      });

      toast.success("Payment marked as paid");
      setMarkAsPaidDialog(false);
      setSelectedPayment(null);
      setPaymentMethod("");
      setTransactionId("");

      // Reload payments
      const params =
        statusFilter !== "all" ? { status: statusFilter } : undefined;
      const result = await getRentPayments(params);
      setRentPayments(result.rentPayments);
      setSummary(result.summary);
    } catch {
      toast.error("Failed to update payment");
    }
  };

  const filteredPayments = rentPayments.filter((payment) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      payment.rental.property.name.toLowerCase().includes(searchLower) ||
      payment.rental.tenant.user.name?.toLowerCase().includes(searchLower) ||
      payment.rental.tenant.user.email.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "OVERDUE":
        return <Badge className="bg-red-500">Overdue</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Rent Management</h1>
        <p className="text-muted-foreground">Track and manage rent payments</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Due</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalDue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalPaid)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overdueCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by property, tenant name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rent Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Rent Payments</CardTitle>
          <CardDescription>
            Manage all rent payments from your tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading rent payments...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rent payments found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {payment.rental.property.name}
                      </h3>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tenant:{" "}
                      {payment.rental.tenant.user.name ||
                        payment.rental.tenant.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due Date: {formatDate(payment.dueDate)}
                    </p>
                    {payment.paidDate && (
                      <p className="text-sm text-muted-foreground">
                        Paid Date: {formatDate(payment.paidDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold mb-2">
                      {formatCurrency(payment.amount)}
                    </div>
                    {payment.status !== "PAID" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setMarkAsPaidDialog(true);
                        }}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark as Paid Dialog */}
      <Dialog open={markAsPaidDialog} onOpenChange={setMarkAsPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payment as Paid</DialogTitle>
            <DialogDescription>
              Enter payment details to mark this rent payment as paid
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                placeholder="e.g., Bank Transfer, Cash, UPI"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                placeholder="Enter transaction reference"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkAsPaidDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isUpdating || !paymentMethod}
            >
              {isUpdating ? "Updating..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
