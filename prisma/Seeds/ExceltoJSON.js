


// Extracting the complete information from the excel file

import xlsx from "xlsx"

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

function extractRelevantMemberInformation(filePath) {
    // memberJSON might contain other irrelevant information for our usecase
    const memberJSON = convertMemberExcelToJSON(filePath);
    // taking only relevant information
    const memberInformation = {};
    memberJSON.map((member) => {
        memberInformation['Name'] = member['EmpName'];
        memberInformation['Username'] = member['EmpID'];
        memberInformation['Email'] = member['Email'];
        memberInformation['PhoneNo'] = member['Mobile'];
        memberInformation['Designation'] = member['Designation'];
        memberInformation['Role'] = member['Role '];
    });
    return memberInformation;
}

function convertBookExcelToJSON(filePath) {
    const workbook = xlsx.readFile(filePath);
    // assuming the firstSheet is the Book Information Sheet
    const sheetName = workbook.SheetNames[0];
    const workSheet = workbook.Sheets[sheetName];
    const bookJSON = xlsx.utils.sheet_to_json(workSheet, {
        defval: null
    });
    return bookJSON;
}


const member_info = extractRelevantMemberInformation()