import * as React from "react";
import { Construction } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export function InDevelopmentPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Módulo em desenvolvimento"
        description="Esta funcionalidade será disponibilizada nas próximas etapas do SistemOS."
      />
    </div>
  );
}
