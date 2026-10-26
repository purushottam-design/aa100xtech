"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listPayments } from "@/lib/payments.functions";
import { paymentStatusLabels } from "@/lib/payment-gateways";

export function PaymentManagement() {
  const [gateway, setGateway] = useState<"all" | "razorpay" | "icici">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["payments", gateway, search, page],
    queryFn: () => listPayments({ data: { gateway, search, page } }),
    retry: false,
  });
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">Payments & transactions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Read-only payment records. Payment success is confirmed by the server.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Search payments"
          placeholder="Search order ID or customer name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-48 flex-1"
        />
        <select
          aria-label="Filter payment gateway"
          value={gateway}
          onChange={(e) => {
            setGateway(e.target.value as typeof gateway);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All gateways</option>
          <option value="razorpay">Razorpay</option>
          <option value="icici">ICICI Bank</option>
        </select>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      {query.isLoading ? (
        <p>Loading payments…</p>
      ) : query.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      ) : !query.data?.rows.length ? (
        <p className="py-8 text-sm text-muted-foreground">No matching payment records.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                {[
                  "Customer",
                  "Order ID",
                  "Amount",
                  "Gateway",
                  "Transaction ID",
                  "Payment status",
                  "Payment date",
                ].map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.customerName}</TableCell>
                  <TableCell className="font-mono text-xs">{row.orderId}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: row.currency,
                    }).format(row.amount)}
                  </TableCell>
                  <TableCell>{row.gateway === "icici" ? "ICICI Bank" : "Razorpay"}</TableCell>
                  <TableCell className="font-mono text-xs">{row.transactionId ?? "—"}</TableCell>
                  <TableCell>
                    {row.rawStatus.toUpperCase() === "REFUNDED"
                      ? "Payment Refunded"
                      : paymentStatusLabels[row.status]}
                  </TableCell>
                  <TableCell>
                    {row.paidAt ? new Date(row.paidAt).toLocaleString() : "Not recorded"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{query.data?.total ?? 0} records</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span>
            {page} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
