const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbName = process.env.DB_NAME || 'kaagapay_dayong';

async function setupDatabase() {
  console.log('--------------------------------------------------');
  console.log(' Kaagapay Dayong — Database Setup & Migration');
  console.log('--------------------------------------------------');
  console.log(`Target database: ${dbName} at ${dbHost}:${dbPort} as ${dbUser}`);

  // Step 1: Connect to default postgres DB to ensure target database exists
  let client;
  if (process.env.DATABASE_URL) {
    client = new Client({ connectionString: process.env.DATABASE_URL });
  } else {
    client = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: 'postgres'
    });
  }

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL server.');

    // Only attempt CREATE DATABASE if not using a cloud URL with pre-allocated DB
    if (!process.env.DATABASE_URL) {
      const checkRes = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );

      if (checkRes.rowCount === 0) {
        console.log(`Creating database "${dbName}"...`);
        await client.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✓ Database "${dbName}" created successfully.`);
      } else {
        console.log(`✓ Database "${dbName}" already exists.`);
      }
    }
  } catch (err) {
    console.warn(`! Note on initial server connect: ${err.message}`);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }

  // Step 2: Connect directly to kaagapay_dayong database to run schema and seeds
  const appDbClient = process.env.DATABASE_URL
    ? new Client({ connectionString: process.env.DATABASE_URL })
    : new Client({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName
      });

  try {
    await appDbClient.connect();
    console.log(`✓ Connected to "${dbName}".`);

    // Run database.sql
    const schemaPath = path.join(__dirname, 'database.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Running database.sql schema...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await appDbClient.query(schemaSql);
      console.log('✓ database.sql executed successfully.');
    }

    // Run seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('Running seed.sql initial data...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await appDbClient.query(seedSql);
      console.log('✓ seed.sql executed successfully.');
    }

    // Verify row counts
    const userCount = await appDbClient.query('SELECT COUNT(*) FROM users');
    const dueCount = await appDbClient.query('SELECT COUNT(*) FROM dues');
    const paymentCount = await appDbClient.query('SELECT COUNT(*) FROM payments');
    const claimCount = await appDbClient.query('SELECT COUNT(*) FROM claims');
    const benefitCount = await appDbClient.query('SELECT COUNT(*) FROM benefit_types');

    console.log('--------------------------------------------------');
    console.log('Database verification summary:');
    console.log(`- Users: ${userCount.rows[0].count}`);
    console.log(`- Dues: ${dueCount.rows[0].count}`);
    console.log(`- Payments: ${paymentCount.rows[0].count}`);
    console.log(`- Claims: ${claimCount.rows[0].count}`);
    console.log(`- Benefit types: ${benefitCount.rows[0].count}`);
    console.log('--------------------------------------------------');
    console.log('✓ Database setup completed successfully!');
  } catch (err) {
    console.error('✗ Database setup error:', err);
    process.exit(1);
  } finally {
    await appDbClient.end();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
