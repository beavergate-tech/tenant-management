"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateAgreement } from "@/hooks/agreement";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type Rental = {
  id: string;
  property: {
    name: string;
    address: string;
  };
  tenant: {
    user: {
      name: string | null;
      email: string;
    };
  };
};

export default function NewAgreementPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [formData, setFormData] = useState({
    rentalId: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    securityDeposit: "",
    terms: "",
  });

  const [createAgreement, { isLoading }] = useCreateAgreement();

  useEffect(() => {
    const loadRentals = async () => {
      try {
        const response = await fetch("/api/rentals");
        const result = await response.json();
        if (response.ok) {
          setRentals(result.rentals || []);
        }
      } catch (error) {
        console.error("Failed to load rentals:", error);
      }
    };

    loadRentals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createAgreement({
        rentalId: formData.rentalId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        rentAmount: parseFloat(formData.rentAmount),
        securityDeposit: parseFloat(formData.securityDeposit),
        terms: formData.terms,
      });

      toast.success("Agreement created successfully");
      router.push("/landlord/agreements");
    } catch {
      toast.error("Failed to create agreement");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="p-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Rent Agreement</h1>
        <p className="text-muted-foreground">Create a new rental agreement</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agreement Details</CardTitle>
          <CardDescription>
            Fill in the details for the new rental agreement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rentalId">Rental *</Label>
              <Select
                value={formData.rentalId}
                onValueChange={(value) => handleChange("rentalId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a rental" />
                </SelectTrigger>
                <SelectContent>
                  {rentals.map((rental) => (
                    <SelectItem key={rental.id} value={rental.id}>
                      {rental.property.name} -{" "}
                      {rental.tenant.user.name || rental.tenant.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentAmount">Monthly Rent (₹) *</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  step="0.01"
                  value={formData.rentAmount}
                  onChange={(e) => handleChange("rentAmount", e.target.value)}
                  placeholder="25000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security Deposit (₹) *</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  step="0.01"
                  value={formData.securityDeposit}
                  onChange={(e) =>
                    handleChange("securityDeposit", e.target.value)
                  }
                  placeholder="50000"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Terms and Conditions *</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => handleChange("terms", e.target.value)}
                placeholder="Enter the terms and conditions of the rental agreement..."
                rows={8}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Agreement"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
