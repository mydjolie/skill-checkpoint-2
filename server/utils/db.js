import * as pg from "pg";
const { Pool } = pg.default;

const pool = new Pool({
  connectionString:
    "postgresql://postgres:pg1234@localhost:5432/skill-checkpoint-2-new",
});

export { pool };
