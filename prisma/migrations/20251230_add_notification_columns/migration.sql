-- Ensure Notification has all expected columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'channel'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "channel" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'to'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "to" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'status'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "status" TEXT DEFAULT 'PENDING';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'providerResult'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "providerResult" JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'sentAt'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "sentAt" TIMESTAMP(3);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT now();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT now();
    END IF;
END$$;
