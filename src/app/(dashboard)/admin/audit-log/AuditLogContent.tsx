"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  createdBy: { name: string };
  affectedUser: { name: string } | null;
  goalSheet: { employee: { name: string; employeeCode: string } } | null;
};

export default function AuditLogPageContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/audit-logs?limit=50");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.logs as AuditLogRow[];
    },
  });

  return (
    <>
      <Topbar title="Audit log" />
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance trail</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Employee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entityType}</TableCell>
                      <TableCell className="text-sm">{log.createdBy.name}</TableCell>
                      <TableCell className="text-sm">
                        {log.goalSheet?.employee.name ??
                          log.affectedUser?.name ??
                          "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
