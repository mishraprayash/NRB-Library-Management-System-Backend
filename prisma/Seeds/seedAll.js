import { handleBooksSeeding } from './seedBooks.js';
import { handleMembersSeeding } from './seedMembers.js';
import { handleVariablesSeeding } from './seedVariables.js';

async function seedAllData() {
  try {
    console.log('🌱Seeding Variables...');
    await handleVariablesSeeding();
    console.log('🌱Seeding books...');
    await handleBooksSeeding();
    console.log('🌱Seeding members...');
    await handleMembersSeeding();

    console.log('✅ All data seeded successfully!');
  } catch (error) {
    console.log('Error while seeding all data', error);
  }
}

seedAllData();
