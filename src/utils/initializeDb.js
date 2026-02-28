import { runSeeds } from '../db/seeds/index.js';

export async function initializeDatabase(pool) {
  const client = await pool.connect();

  try {
    console.log('🟢 Initializing database schema...');

    await client.query('BEGIN');

    // ---- FORMS PARA SERVICES ----
    await client.query(`      
      CREATE TABLE IF NOT EXISTS forms (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      );
    `);
    
    // ---- SERVICES ----
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        short_label VARCHAR(50),
        description TEXT,
        info TEXT,
        ui_color VARCHAR(7) NOT NULL,
        display_order INT NOT NULL,
        requires_form BOOLEAN NOT NULL DEFAULT false,
        service_group VARCHAR(50) NOT NULL,
        duration_minutes INT NULL,
        scheduling_type TEXT NOT NULL DEFAULT 'fixed_block',
        form_id INT REFERENCES forms(id),
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS form_fields (
        id SERIAL PRIMARY KEY,
        form_id INT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        field_key VARCHAR(50) NOT NULL,
        label VARCHAR(100) NOT NULL,
        type VARCHAR(30) NOT NULL,
        required BOOLEAN NOT NULL DEFAULT false,
        placeholder VARCHAR(100),
        options JSONB,
        display_order INT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT unique_form_field UNIQUE (form_id, field_key)
      );
    `);
    
    // ---- BOOKINGS ----
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        service_id INT REFERENCES services(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_slot TIME NOT NULL,
        customer_data JSONB,
        status TEXT DEFAULT 'confirmed',
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(service_id, date, time_slot)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        service_id INT NOT NULL REFERENCES services(id),
        form_id INT REFERENCES forms(id),
        payload JSONB NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    // ---- SERVICE AVAILABILITY ----
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_availability (
        id SERIAL PRIMARY KEY,
        service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_slot TIME NOT NULL,
        capacity INT NOT NULL DEFAULT 1,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (service_id, date, time_slot)
      );
    `);

    // ---- SERVICE SCHEDULE CONFIG (future rules) ----
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_schedule_config (
        id SERIAL PRIMARY KEY,
        service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
        blocks INT DEFAULT 1,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    // ---- WELCOME MESSAGE ----
    await client.query(`
      CREATE TABLE IF NOT EXISTS welcome_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        sub_message TEXT,
        duration_ms INTEGER NOT NULL DEFAULT 3000,
        valid_from TIMESTAMP,
        valid_to TIMESTAMP,
        priority INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // ---- BACKOFFICE USER ----
    await client.query(`
      CREATE TABLE IF NOT EXISTS backoffice_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await client.query('COMMIT');

    await runSeeds(pool);

    console.log('✅ Database schema ready.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('🔴 Database initialization failed', {
      message: err.message,
      code: err.code
    });
    throw err;
  } finally {
    client.release();
  }
}
