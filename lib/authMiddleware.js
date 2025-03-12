import jwt from "jsonwebtoken";
import JsonWebTokenError from "jsonwebtoken/lib/JsonWebTokenError.js";

// Check if the token is valid or not
export const isAuthorized = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ message: "Unauthorized Access. Token doesnot exist" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Unauthorized Access. Token doesnot exists" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return res.status(403).json({ message: "Unauthorized Access. JSON WebToken Error" });
    }
    return res.status(500).json({ message: "Internal Server Error during Authentication", });
  }
};


export const isCookieAuthorized = async (req, res, next) => {
  try {

    const { token } = req.cookies
    if (!token) {
      return res.status(403).json({ message: "Unauthorized Access. Token doesnot exists" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.log('Error while validating token', error);
    return res.status(500).json({ message: "Internal Server Error while validating cookies" });
  }
}

// For the task that can be performed by both admin and superadmin
export const admin_superAdmin_both = (req, res,next) => {
  try {
    if (req.user.role === "ADMIN" || req.user.role === "SUPERADMIN") {
      next();
    }
    else {
      return res.status(403).json({ message: "Unauthorized Access. Not Enough Permission. You must be admin or superadmin." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error while validating role" });
  }
}

// For the task that can only be performed by superadmin
export const super_admin_only = (req, res,next) => {
  try {
    if (req.user.role === "SUPERADMIN") {
      next();
    }
    else {
      return res.status(403).json({ message: "Unauthorized Access. Not Enough Permission. You must be superadmin." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error while validating role" });
  }
}
