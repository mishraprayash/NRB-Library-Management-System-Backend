
import prisma from "../../lib/prisma.js";
import bcrypt from "bcryptjs";


export const getMembers = async (req, res) => {
    try {
        // const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(403).json({ message: "Unauthorized Access" });
        // }
        const allMembers = await prisma.member.findMany({
            where: {
                role: "MEMBER"
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phoneNo: true,
                _count: {
                    select: {
                        borrowedBooks: {
                            where: {
                                returned: false
                            },
                        },

                    },
                },
            },

        });

        allMembers.sort((a,b)=>b._count.borrowedBooks - a._count.borrowedBooks)


        return res.status(200).json({ message: "Members Fetched Successfuly", members: allMembers })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export const getSingleMember = async (req, res) => {
    try {
        const { memberId } = req.body;
        if (!memberId || !Number.isInteger(memberId)) {
            return res.status(400).json({ message: "Required member-id and it must be an integer" });
        }
        const memberExist = await prisma.member.findUnique({
            where: {
                id: memberId,
                role: "MEMBER"
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phoneNo: true,
                createdAt: true
            }
        })
        if (!memberExist) {
            return res.status(400).json({ message: "Member with this id doesnot exist" });
        }

        return res.status(200).json({
            message: "Memeber Fetched Successfully", member: {
                id: memberExist.id,
                name: memberExist.name,
                username: memberExist.username,
                email: memberExist.email,
                phoneNo: memberExist.phoneNo,
                createdAt: memberExist.createdAt
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const addMember = async (req, res) => {
    try {
        // const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(403).json({ message: "Unauthorized Access" });
        // }
        const { name, username, email, password, phoneNo } = req.body;
        if (!name || !username || !email || !password || !phoneNo) {
            return res.status(400).json({ message: "All fields are mandatory" });
        }

        // query if user with same username or email already exists
        const memberExist = await prisma.member.findFirst({
            where: {
                OR: [
                    { username }, { email }, { phoneNo }
                ]
            }
        })

        if (memberExist) {
            return res.status(400).json({ message: "Username already exists" });
        }
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create a new member if doesnot exists
        const addedMember = await prisma.member.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNo
            }
        })
        if (!addedMember) {
            return res.status(400).json({ message: "Error while adding member" });
        }

        return res.status(200).json({
            message: "Member added successfully", member: {
                id: addedMember.id,
                name: addedMember.name,
                username: addedMember.username,
                email: addedMember.email,
                phoneNo: addedMember.phoneNo,
                createdAt: addedMember.createdAt
            }
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const editMember = async (req, res) => {
    try {

        // const isUserAuthenticated = isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(403).json({ message: "Unauthorized Access" });
        // }

        const { id, name, username, phoneNo, email } = req.body;
        if (!id || !name || !username || !phoneNo || !email) {
            return res.status(400).json({ message: "All fields are mandatory" });
        }

        if (!Number.isInteger(id) || typeof name !== "string" || typeof username !== "string" || typeof phoneNo !== "string" || typeof email !== "string") {
            return res.status(400).json({ message: "Invalid data types" });
        }

        const memberExist = await prisma.member.findUnique({
            where: {
                id
            }
        })

        // validating member exists.
        if (!memberExist) {
            return res.status(400).json({ message: "Member doesnot exist" });
        }

        // validating changes have been made from the client side.
        if (
            memberExist.name === name &&
            memberExist.username === username &&
            memberExist.phoneNo === phoneNo &&
            memberExist.email === email
        ) {
            return res.status(400).json({ message: "Please update something before saving changes" });
        }

        const updateMember = await prisma.member.update({
            where: {
                id
            },
            data: {
                name,
                username,
                phoneNo,
                email
            }
        })

        if (!updateMember) {
            return res.status(400).json({ message: "Error while updating member" });
        }
        return res.status(200).json({ message: "Member Updated Successfully" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });

    }
}




/** 
- A single member can be deleted based on member-id.
- Multiple member can be deleted based on collection of member-ids.

Both should be sent as an array
 **/

export const deleteMember = async (req, res) => {
    try {
        // const isUserAuthenticated = isSuperAdmin(req);
        // if (!isUserAuthenticated) {
        //     return res.status(403).json({ message: "Unauthorized Access" });

        // }
        // take an array from the client side.
        const { memberIds } = req.body;

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return res.json({ message: "Array of member Id required with at least one integer value" });
        }

        // Ensure all elements are valid integers
        if (!memberIds.every(id => Number.isInteger(id))) {
            return res.status(400).json({ message: "All member IDs must be integers." });
        }

        // Fetch only existing members
        const existingMembers = await prisma.member.findMany({
            where: {
                borrowedBooks: {
                    none: {}, // No borrowed books associated
                },
            },
            select: {
                id: true,
                name: true,
                username: true,
            },
        });

        const validMemberIds = existingMembers.map((member) => member.id);

        const invalidMemberIds = memberIds.filter((id) => !validMemberIds.includes(id))

        const deletedMembers = await prisma.member.deleteMany({
            where: { id: { in: validMemberIds } }
        })

        if (deletedMembers.count === 0) {
            return res.status(400).json({ message: "Provide valid member-ids" });
        }

        return res.status(200).json({
            message: "Successfully Deleted Member",
            successDeletes: deletedMembers.count,
            invalidIds: invalidMemberIds
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error" });
    }

}

