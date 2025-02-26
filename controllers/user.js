

const getBooks = async () => {

}
const getIssuedBooks = async () => {

}
const assignNewBook = async () => {

}
const returnIssuedBook = async () => {

}

const addBook = async () => {

}
const editBook = async () => {

}

const deleteBook = async () => {

}


export const editMember = async () => {
    try {
        const isUserAuthenticated = isAdmin(req) || isSuperAdmin(req);
        if(!isUserAuthenticated){
            return res.status(403).json({ message: "Unauthorized Access" });   
        }

        const {name,username,email,phoneNo} = req.body
        
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
        
    }

}
const deleteMembers = async () => {

}


export {
    register,
    login,
    getBooks,
    getIssuedBooks,
    assignNewBook,
    returnIssuedBook,
    addBook,
    editBook,
    deleteBook,
    getMembers,
    addMembers,
    editMembers,
    deleteMembers
}