import { seedForms } from './seedForms.js';
import { seedFormFields } from './seedFormFields.js';
import { seedServices } from './seedServices.js';
import { seedWelcomeMessage } from './seedWelcomeMessage.js';
import { seedBackofficeUser } from './seedBackofficeUser.js';
import { config } from '../../config/env.js';

export async function runSeeds(pool) {
  console.log('🌱 Running seeds...');

  await seedForms(pool);
  await seedFormFields(pool);
  await seedServices(pool);
  await seedWelcomeMessage(pool);
  await seedBackofficeUser(pool, config);

  console.log('🌱 Seeds completed');
}
