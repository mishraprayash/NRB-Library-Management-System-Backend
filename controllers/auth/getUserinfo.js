import jwt from "jsonwebtoken"

export const getUserInfo = (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(403).json({ message: "Unauthorized Access" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(403).json({ message: "Unauthorized Access" });
        }
        const decodedToken = jwt.verify(token.toString(), process.env.JWT_SECRET);
        return res.status(200).json({ message: "Token Validation Success", token: decodedToken })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error while validating token", error })
    }
}