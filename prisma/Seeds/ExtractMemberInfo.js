
import memberJson from "./employee_info.json" with {type:'json'}


function extractRelevantInformationOnly(){

    let memberInformation = {};
    
    memberJson.map((member)=>{
        memberInformation["Name"] = member["EmpName"];
        memberInformation["Username"] = member["EmpID"];
        memberInformation["Email"]  = member["Email"];
        memberInformation["PhoneNo"] = member['Mobile'];
        memberInformation["Designation"] = member['Designation']
        memberInformation["Role"] = member["Role "]
    })

}