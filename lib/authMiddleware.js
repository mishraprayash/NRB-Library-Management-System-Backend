import jwt from "jsonwebtoken";
import JsonWebTokenError from "jsonwebtoken/lib/JsonWebTokenError.js";

export const isAuthorized = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ message: "Unauthorized Access" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Unauthorized Access" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return res.status(403).json({ message: "Unauthorized Access" });
    }
    return res.status(500).json({ error });
  }
};


export const isCookieAuthorized = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Get the token from cookies
    if (!token) {
      return res.status(403).json({ message: "Unauthorized Access: Token not provided" });
    }

    // Verify JWT
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user info to the request object
    req.user = decodedToken;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({ message: "Unauthorized Access: Token Expired" });
    } 
    if (error instanceof JsonWebTokenError) {
      return res.status(403).json({ message: "Unauthorized Access: Invalid Token" });
    }
    // Log unexpected errors for debugging purposes
    console.error("Authorization error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



