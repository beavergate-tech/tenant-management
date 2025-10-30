"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetAgreements,
  useDeleteAgreement,
  type RentAgreement,
} from "@/hooks/agreement";
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
import { toast } from "sonner";
import { Search, Plus, FileText, Trash2 } from "lucide-react";

export default function AgreementsPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<RentAgreement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedAgreement, setSelectedAgreement] =
    useState<RentAgreement | null>(null);

  const [getAgreements, { isLoading }] = useGetAgreements();
  const [deleteAgreement, { isLoading: isDeleting }] = useDeleteAgreement();

  useEffect(() => {
    const loadAgreements = async () => {
      try {
        const params =
          statusFilter !== "all" ? { status: statusFilter } : undefined;
        const result = await getAgreements(params);
        setAgreements(result.agreements);
      } catch {
        toast.error("Failed to load agreements");
      }
    };

    loadAgreements();
  }, [statusFilter]);

  const handleDelete = async () => {
    if (!selectedAgreement) return;

    try {
      await deleteAgreement(selectedAgreement.id);
      toast.success("Agreement deleted successfully");
      setDeleteDialog(false);
      setSelectedAgreement(null);

      // Reload agreements
      const params =
        statusFilter !== "all" ? { status: statusFilter } : undefined;
      const result = await getAgreements(params);
      setAgreements(result.agreements);
    } catch {
      toast.error("Failed to delete agreement");
    }
  };

  const filteredAgreements = agreements.filter((agreement) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      agreement.rental.property.name.toLowerCase().includes(searchLower) ||
      agreement.rental.tenant.user.name?.toLowerCase().includes(searchLower) ||
      agreement.rental.tenant.user.email.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>;
      case "EXPIRED":
        return <Badge className="bg-gray-500">Expired</Badge>;
      case "TERMINATED":
        return <Badge className="bg-red-500">Terminated</Badge>;
      case "DRAFT":
        return <Badge className="bg-yellow-500">Draft</Badge>;
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rent Agreements</h1>
          <p className="text-muted-foreground">
            Manage rental agreements and contracts
          </p>
        </div>
        <Button onClick={() => router.push("/landlord/agreements/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agreement
        </Button>
      </div>

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
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agreements List */}
      <Card>
        <CardHeader>
          <CardTitle>Agreements</CardTitle>
          <CardDescription>
            View and manage all rental agreements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading agreements...</div>
          ) : filteredAgreements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No agreements found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() =>
                    router.push(`/landlord/agreements/${agreement.id}`)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4" />
                      <h3 className="font-semibold">
                        {agreement.rental.property.name}
                      </h3>
                      {getStatusBadge(agreement.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tenant:{" "}
                      {agreement.rental.tenant.user.name ||
                        agreement.rental.tenant.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Period: {formatDate(agreement.startDate)} -{" "}
                      {formatDate(agreement.endDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Rent: {formatCurrency(agreement.rentAmount)} | Deposit:{" "}
                      {formatCurrency(agreement.securityDeposit)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/landlord/agreements/${agreement.id}/edit`
                        );
                      }}
                    >
                      Edit
                    </Button>
                    {agreement.status === "DRAFT" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgreement(agreement);
                          setDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agreement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agreement? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
