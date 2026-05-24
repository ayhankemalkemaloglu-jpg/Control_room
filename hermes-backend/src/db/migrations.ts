// Schema is ensured as a side-effect of importing the connection (idempotent,
// uses CREATE TABLE/INDEX IF NOT EXISTS). This module exists so the schema can
// also be applied standalone via `npm run migrate`.
import "./connection";
import { logger } from "../utils/logger";

logger.info("migrations complete — schema ensured");

if (require.main === module) {
  process.exit(0);
}
