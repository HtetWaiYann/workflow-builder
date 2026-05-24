/*
  Warnings:

  - A unique constraint covering the columns `[executionId,nodeId]` on the table `ExecutionNodeRun` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExecutionNodeRun_executionId_nodeId_key" ON "ExecutionNodeRun"("executionId", "nodeId");
