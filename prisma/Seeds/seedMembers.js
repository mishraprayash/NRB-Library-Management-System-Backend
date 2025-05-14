import xlsx from 'xlsx';
import prisma from '../../lib/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { extractRelevantMemberInformation } from './ExceltoJSON.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// for dummy data
function generateRandomEmail(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result + '@testmail.com';
}

// for testing - dummy emails
async function seedMembersWithFakeEmail() {
  let totalMembers = 0;
  let successfullEntries = 0;
  const memberJson = extractRelevantMemberInformation(path.join(__dirname, '/MemberList.xlsx'));
  try {
    await prisma.member.deleteMany();

    const promises = [];

    for (const member of memberJson) {
      totalMembers++;
      const username = member['username'].toString().trim();
      const name = member['name'].toString().trim();
      const phoneNo = member['phoneNo'].toString().trim();
      const designation = member['designation'].toString().trim().toUpperCase();
      let role = member['role'].toString().trim();
      const email = generateRandomEmail(10);

      if (role === 'Super Admin') role = 'SUPERADMIN';
      else if (role === 'Admin') role = 'ADMIN';
      else role = 'MEMBER';

      const hashsedPassword = await bcrypt.hash(username, 10);

      let memberData = {
        name,
        username,
        email,
        password: hashsedPassword,
        phoneNo,
        designation,
        role,
      };

      // Just push the create promise
      promises.push(prisma.member.create({ data: memberData }));
    }

    // Use Promise.allSettled instead
    const results = await Promise.allSettled(promises);

    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        successfullEntries++;
      } else if (result.status === 'rejected') {
        console.log(
          `Error while entering member ${memberJson[index].name}:`,
          result.reason.message
        );
      }
    }

    console.log(`Total Members: ${totalMembers}`);
    console.log(`Successful Entry Members: ${successfullEntries}`);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// for production -- real data
export async function handleMembersSeeding() {
  let totalMembers = 0;
  let successfullEntries = 0;
  const memberJson = extractRelevantMemberInformation(path.join(__dirname, '/MemberList.xlsx'));
  try {
    await prisma.member.deleteMany();

    const promises = [];

    for (const member of memberJson) {
      totalMembers++;
      const username = member['username'].toString().trim();
      const name = member['name'].toString().trim();
      const phoneNo = member['phoneNo'].toString().trim();
      const designation = member['designation'].toString().trim().toUpperCase();
      let role = member['role'].toString().trim();
      let email = member['email'];
      if (email === null) {
        email = generateRandomEmail(10);
      }
      email = email.toString().trim();

      if (role === 'Super Admin') role = 'SUPERADMIN';
      else if (role === 'Admin') role = 'ADMIN';
      else role = 'MEMBER';

      const hashedPassword = await bcrypt.hash(username, 10);

      let memberData = {
        name,
        username,
        email,
        password: hashedPassword,
        phoneNo,
        designation,
        role,
      };

      // Just push the create promise
      promises.push(prisma.member.create({ data: memberData }));
    }

    // Use Promise.allSettled instead
    const results = await Promise.allSettled(promises);

    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        successfullEntries++;
      } else if (result.status === 'rejected') {
        console.log(
          `Error while entering member ${memberJson[index].name}:`,
          result.reason.message
        );
      }
    }

    console.log(`Total Members: ${totalMembers}`);
    console.log(`Successful Entry Members: ${successfullEntries}`);
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

// seedMembersWithFakeEmail()
//   .finally(async () => prisma.$disconnect())
