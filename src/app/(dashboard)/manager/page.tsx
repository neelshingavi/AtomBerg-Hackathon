import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

export default async function ManagerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pending = await prisma.goalSheet.count({
    where: { managerId: session.user.id, status: "SUBMITTED" },
  });

  const teamSize = await prisma.user.count({
    where: { managerId: session.user.id, isActive: true },
  });

  return (
    <>
      <Topbar title="Manager dashboard" />
      <PageContainer>
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Team size</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{teamSize}</p>
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
        <ButtonLink href="/manager/approvals">Review approvals</ButtonLink>
      </PageContainer>
    </>
  );
}
