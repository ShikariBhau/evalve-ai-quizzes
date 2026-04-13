import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { useInMemoryDB, findUserById } from '../store.js';
dotenv.config();
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jwt.verify(token, secret);
        const user = useInMemoryDB
            ? await findUserById(decoded.id)
            : await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = {
            id: useInMemoryDB ? user.id : user._id.toString(),
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
export const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
export const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({ id: userId }, secret, { expiresIn });
};
//# sourceMappingURL=auth.js.map
