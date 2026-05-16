"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsPage() {
  const [teamsUrl, setTeamsUrl] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        teamsWebhookUrl: string;
        teamsWebhookConfigured: boolean;
        azureAdConfigured: boolean;
      };
    },
  });

  useEffect(() => {
    if (data?.teamsWebhookUrl) setTeamsUrl(data.teamsWebhookUrl);
  }, [data?.teamsWebhookUrl]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamsWebhookUrl: teamsUrl }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => toast.success("Settings saved"),
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <Topbar title="Integrations" />
      <PageContainer className="max-w-2xl space-y-6">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Microsoft Teams</CardTitle>
                <CardDescription>
                  Incoming webhook URL for adaptive card notifications when goals are submitted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Webhook URL</Label>
                  <Input
                    type="url"
                    placeholder="https://outlook.office.com/webhook/..."
                    value={teamsUrl}
                    onChange={(e) => setTeamsUrl(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={data?.teamsWebhookConfigured ? "default" : "secondary"}>
                    {data?.teamsWebhookConfigured ? "Configured" : "Not configured"}
                  </Badge>
                </div>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  Save webhook
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Azure AD SSO</CardTitle>
                <CardDescription>
                  Configure AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID in
                  environment variables to enable Microsoft sign-in.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant={data?.azureAdConfigured ? "default" : "secondary"}>
                  {data?.azureAdConfigured ? "Enabled" : "Not configured"}
                </Badge>
              </CardContent>
            </Card>
          </>
        )}
      </PageContainer>
    </>
  );
}
