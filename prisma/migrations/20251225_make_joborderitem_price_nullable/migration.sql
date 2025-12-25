-- Make quantity, unitPrice and totalPrice nullable on JobOrderItem
ALTER TABLE "JobOrderItem" ALTER COLUMN "quantity" DROP NOT NULL;
ALTER TABLE "JobOrderItem" ALTER COLUMN "unitPrice" DROP NOT NULL;
ALTER TABLE "JobOrderItem" ALTER COLUMN "totalPrice" DROP NOT NULL;