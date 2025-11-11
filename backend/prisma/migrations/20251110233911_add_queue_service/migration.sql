-- CreateTable
CREATE TABLE "queue_services" (
    "id" SERIAL NOT NULL,
    "queue_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "preco_aplicado" DOUBLE PRECISION,
    "tempo_estimado_aplicado" INTEGER,

    CONSTRAINT "queue_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_services_queue_id_idx" ON "queue_services"("queue_id");

-- CreateIndex
CREATE INDEX "queue_services_service_id_idx" ON "queue_services"("service_id");

-- AddForeignKey
ALTER TABLE "queue_services" ADD CONSTRAINT "queue_services_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_services" ADD CONSTRAINT "queue_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
