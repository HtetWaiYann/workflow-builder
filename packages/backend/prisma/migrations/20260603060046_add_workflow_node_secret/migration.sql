-- CreateTable
CREATE TABLE "WorkflowNodeSecret" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowNodeSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowNodeSecret_workflowId_idx" ON "WorkflowNodeSecret"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowNodeSecret_workflowId_nodeId_key" ON "WorkflowNodeSecret"("workflowId", "nodeId");

-- AddForeignKey
ALTER TABLE "WorkflowNodeSecret" ADD CONSTRAINT "WorkflowNodeSecret_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
