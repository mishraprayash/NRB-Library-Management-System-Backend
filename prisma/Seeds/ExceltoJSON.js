
import xlsx from "xlsx";

import path from "path";

import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
input -filepath 
output - Members information in JSON 
*/
export function convertMemberExcelToJSON(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = 'Employee Information';
    const workSheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(workSheet, {
        range: 4,
        defval: null
    })
    return jsonData
}

/* 
input - filePath
output - relevant memberInformation object for our usecase
*/
export function extractRelevantMemberInformation(filePath) {
    // memberJSON might contain other irrelevant information for our usecase
    const memberJSON = convertMemberExcelToJSON(filePath);
    // taking only relevant information
    const allMembers = [];
    memberJSON.map((member) => {
        let memberInformation = {};
        memberInformation['name'] = member['EmpName'];
        memberInformation['username'] = member['EmpID'];
        memberInformation['email'] = member['Email'];
        memberInformation['phoneNo'] = member['Mobile'];
        memberInformation['designation'] = member['Designation'];
        memberInformation['role'] = member['Role '];
        allMembers.push(memberInformation);
    });
    return allMembers;
}

/* 
input - filePath
output - Books JSON
*/
export function convertBookExcelToJSON(filePath) {
    const workbook = xlsx.readFile(filePath);
    // assuming the firstSheet is the Book Information Sheet
    // if name is known then const sheetName = 'Book Information'
    const sheetName = workbook.SheetNames[0];
    const workSheet = workbook.Sheets[sheetName];
    const bookJSON = xlsx.utils.sheet_to_json(workSheet, {
        defval: null
    });
    return bookJSON;
}
