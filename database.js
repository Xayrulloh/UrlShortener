const { Pool } = require("pg");

const pool = new Pool({
  host: "postgres_db",
  port: 5432,
  user: "xayrulloh",
  password: "password",
  database: "urls",
});

const fetch = async (SQL, ...params) => {
  const client = await pool.connect();
  try {
    const {
      rows: [row],
    } = await client.query(SQL, params.length ? params : null);
    return row;
  } catch (error) {
    console.error(error);
  } finally {
    await client.release();
  }
};

(async function () {
  await fetch(`create table if not exists urls (id serial primary key, url varchar not null, shorturl varchar not null)`);
})();

module.exports = {
  fetch,
};
