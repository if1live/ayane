-- https://x-team.com/blog/automatic-timestamps-with-postgresql/
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE "ayane_kernel" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON ayane_kernel
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE UNIQUE INDEX "ayane_kernel_name_key" ON "ayane_kernel"("name");
