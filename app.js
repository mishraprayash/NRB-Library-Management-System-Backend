import express from "express";
import cors from "cors";
import { config } from "dotenv"
import cookieParser from "cookie-parser"


// import userRoute from "./routes/userRoute.js"
import adminRoute from "./routes/adminRoute.js"
import commonRoute from "./routes/commonRoute.js"

config();
const app = express();
const PORT = process.env.PORT || 5000

// middlewares
app.use(express.json())
app.use(cookieParser())


// if (process.env.NODE_ENV === "development") {
//     app.use(
//         cors({
//             origin: "https://localhost:5000",
//             credentials: true,
//         })
//     );
// }

// if (process.env.NODE_ENV === "production") {
//     app.use(
//         cors({
//             origin: "https://xyz.onrender.com",
//             credentials: true,
//         })
//     );
// }
// if we donot want to use any libraries then we ned to manually set specific headers in the HTTP request.
// app.use(function(req, res, next) {  
//     console.log(req.headers.origin)
//     res.header('Access-Control-Allow-Origin', "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });


// app.use('/api/v1/user', userRoute);
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/common', commonRoute);




app.get('/', (req, res) => {
    res.json({ message: "Server is running...." })
})


const startServer = () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on PORT ${PORT}`)
        })
    } catch (error) {
        console.log(`Error occured while starting server: ${error}`)
    }
}
startServer();