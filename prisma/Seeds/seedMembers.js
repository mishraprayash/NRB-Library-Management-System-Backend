import xlsx from 'xlsx';
import prisma from '../../lib/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import memberJson from './employee_info.json' with { type: 'json' };
import { extractRelevantMemberInformation } from './ExceltoJSON.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
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

// for production -- real data
async function seedMemberWithOriginalEmail() {
  const BATCH_SIZE = 500;
  try {
    let batch = []
    for (const [index, info] of memberJson.entries()) {

      const username = info['EmpID'].toString().trim();
      const name = info['EmpName'].toString().trim();
      const phoneNo = info['Mobile'].toString().trim();
      const password = info['EmpID'].toString().trim();
      const designation = info['Designation'].toString().trim();
      let role = info['Role '].toString().trim();
      const email = info['Email'].toString().trim();

      if (role === 'Super Admin') role = 'SUPERADMIN';
      else if (role === 'Admin') role = 'ADMIN';
      else role = 'MEMBER';

      const hashsedPassword = await bcrypt.hash(password, 10);

      batch.push({
        username,
        name,
        phoneNo,
        password: hashsedPassword,
        designation,
        role,
        email,
      });

      if (batch.length === BATCH_SIZE || index === memberJson.length - 1) {
        await prisma.member.createMany({
          data: batch
        });
      }
      console.log(`✅ Inserted batch of ${batch.length} members`);
      batch = []; // clear batch
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// for testing 
async function seedMembersWithFakeEmail() {
  let totalMembers = 0;
  let successfullEntries = 0;
  const memberJson = extractRelevantMemberInformation(path.join(__dirname, "/MemberList.xlsx"));
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
        role
      };

      // Just push the create promise
      promises.push(
        prisma.member.create({ data: memberData })
      );
    }

    // Use Promise.allSettled instead
    const results = await Promise.allSettled(promises);

    for (const [index, result] of results.entries()) {
      if (result.status === "fulfilled") {
        successfullEntries++;
      } else if (result.status === "rejected") {
        console.log(`Error while entering member ${memberJson[index].name}:`, result.reason.message);
      }
    }

    console.log(`Total Members: ${totalMembers}`);
    console.log(`Successful Entry Members: ${successfullEntries}`);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

(async function main() {
  seedMembersWithFakeEmail();
})()
