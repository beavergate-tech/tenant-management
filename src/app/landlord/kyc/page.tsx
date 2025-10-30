"use client";

import { useEffect, useState } from "react";
import {
  useGetDocuments,
  useUpdateDocument,
  type Document,
  type DocumentSummary,
} from "@/hooks/document";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  FileCheck,
  Clock,
  File,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function KYCPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [reviewDialog, setReviewDialog] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  );
  const [rejectionReason, setRejectionReason] = useState("");

  const [getDocuments, { isLoading }] = useGetDocuments();
  const [updateDocument, { isLoading: isUpdating }] = useUpdateDocument();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const params =
          statusFilter !== "all" ? { status: statusFilter } : undefined;
        const result = await getDocuments(params);
        setDocuments(result.documents);
        setSummary(result.summary);
      } catch {
        toast.error("Failed to load documents");
      }
    };

    loadDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleReview = async () => {
    if (!selectedDocument) return;

    try {
      await updateDocument(selectedDocument.id, {
        status: documentStatus,
        rejectionReason: rejectionReason || undefined,
      });

      toast.success(`Document ${documentStatus.toLowerCase()}`);
      setReviewDialog(false);
      setSelectedDocument(null);
      setRejectionReason("");

      // Reload documents
      const params =
        statusFilter !== "all" ? { status: statusFilter } : undefined;
      const result = await getDocuments(params);
      setDocuments(result.documents);
      setSummary(result.summary);
    } catch {
      toast.error("Failed to update document");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(searchLower) ||
      doc.tenant.user.name?.toLowerCase().includes(searchLower) ||
      doc.tenant.user.email.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">KYC Document Review</h1>
        <p className="text-muted-foreground">
          Review and verify tenant documents
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Documents
              </CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.rejectedCount}</div>
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
                placeholder="Search by document name, tenant name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Documents</CardTitle>
          <CardDescription>
            Review tenant verification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileCheck className="h-4 w-4" />
                      <h3 className="font-semibold">{doc.fileName}</h3>
                      {getStatusBadge(doc.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tenant: {doc.tenant.user.name || doc.tenant.user.email}
                    </p>
                    {doc.tenant.rentals.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Property: {doc.tenant.rentals[0].property.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Uploaded: {formatDate(doc.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Type: {doc.type}
                    </p>
                    {doc.rejectionReason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Rejection Reason: {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, "_blank")}
                    >
                      View
                    </Button>
                    {doc.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setDocumentStatus("APPROVED");
                          setReviewDialog(true);
                        }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              Approve or reject this verification document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select
                value={documentStatus}
                onValueChange={(value: "APPROVED" | "REJECTED") =>
                  setDocumentStatus(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approve</SelectItem>
                  <SelectItem value="REJECTED">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Rejection Reason (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add rejection reason if rejecting..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleReview} disabled={isUpdating}>
              {isUpdating ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
