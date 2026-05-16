import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [employees, managers, pending] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
    prisma.user.count({ where: { role: "MANAGER", isActive: true } }),
    prisma.goalSheet.count({ where: { status: "SUBMITTED" } }),
  ]);

  return (
    <>
      <Topbar title="Admin dashboard" />
      <PageContainer>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{employees}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{managers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pending}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/users", label: "Users" },
            { href: "/admin/departments", label: "Departments" },
            { href: "/admin/cycles", label: "Cycles" },
            { href: "/admin/reports/achievement", label: "Reports" },
          ].map((link) => (
            <ButtonLink key={link.href} variant="outline" href={link.href}>
              {link.label}
            </ButtonLink>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
