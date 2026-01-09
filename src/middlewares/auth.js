import jwt from "jsonwebtoken";
import asynchandler from "express-async-handler";

const protect = asynchandler((req, res, next) => {
  let token;

  // 1. Check if Authorization header exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Extract token
      token = req.headers.authorization.split(" ")[1];

      // 3. Check if token exists after split
      if (!token) {
        return res.status(401).json({
          message: "Not authorized, malformed token",
          code: "MALFORMED_TOKEN",
        });
      }

      // 4. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 5. Attach user to request
      req.user = decoded;

      // 6. Continue to next middleware
      next();
    } catch (error) {
      console.error("Auth Error:", error.message);

      // 7. Handle specific token errors
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          message: "Invalid token",
          code: "INVALID_TOKEN",
        });
      }

      if (error.name === "NotBeforeError") {
        return res.status(401).json({
          message: "Token not active yet",
          code: "TOKEN_NOT_ACTIVE",
        });
      }

      // 8. Generic token error
      return res.status(401).json({
        message: "Not authorized, token failed",
        code: "TOKEN_FAILED",
      });
    }
  } else {
    // 9. No Authorization header provided
    return res.status(401).json({
      message: "Not authorized, no token provided",
      code: "NO_TOKEN",
    });
  }
});

export default protect;
