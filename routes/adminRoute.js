import express from "express";
import {
    register,
    login,
    addBook,
    editBook,
    borrowBook,
    getAllBorrowedBooks,
    returnBorroweddBook,
    addMember,
    getMembers,
    deleteMember,
    updateVariables,
    createVariables,
    getVariables
} from "../controllers/admin.js";


const router = express.Router();


router.route('/register').post(register);
router.route('/login').post(login);

router.route('/borrowbook').post(borrowBook);
router.route('/getallborrowedbooks').get(getAllBorrowedBooks)
router.route('/returnbook').post(returnBorroweddBook);

router.route('/addbook').post(addBook);
router.route('/editbook').post(editBook);

router.route('/getmembers').get(getMembers);
router.route('/addmember').post(addMember);


router.route('/createvariables').post(createVariables);
router.route('/updatevariables').post(updateVariables);
router.route('/getvariables').get(getVariables)


router.route('/delete-member').post(deleteMember);

export default router;

