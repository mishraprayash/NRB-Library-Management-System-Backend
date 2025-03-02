
export const logout = (req, res) => {
    try {
      // Clear the token cookie
      res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      return res.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  