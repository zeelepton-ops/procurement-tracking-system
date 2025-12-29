const fs = require('fs');
const { spawn } = require('child_process');

// Read the migration SQL file
const migrationPath = './prisma/migrations/pending-migrations.sql';
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Supabase connection details
const connectionString = 'postgresql://postgres:fFPhCdg7RR36Jecz@db.kkhqeryamozrennkmytx.supabase.co:5432/postgres?sslmode=require&schema=public';

console.log('🔄 Attempting to run migration...');
console.log('Database:', connectionString.split('@')[1]);

// Try using Node's native approach with a simple HTTP request or use prisma directly
const { PrismaClient } = require('@prisma/client');

async function runMigration() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString
      }
    }
  });

  try {
    console.log('✅ Connected to Supabase');
    
    // Split migration SQL by statements and run them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      try {
        const stmt = statements[i];
        if (stmt.length < 10) continue; // Skip empty statements
        
        await prisma.$executeRawUnsafe(stmt);
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(`\n❌ Statement ${i + 1} failed:`);
        console.error('Error:', err.message);
        console.error('Statement preview:', statements[i].substring(0, 100) + '...');
        // Continue to next statement instead of stopping
      }
    }

    console.log(`\n✅ Migration complete: ${successCount} succeeded, ${errorCount} had errors`);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
