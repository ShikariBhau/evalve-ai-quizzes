import mongoose from 'mongoose';
export const connectDB = async () => {
    try {
        console.log('Current working directory:', process.cwd());
        console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
        console.log('All env vars with MONGO:', Object.keys(process.env).filter(key => key.includes('MONGO')));

        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.log('⚠️  MONGODB_URI not set - using in-memory storage');
            return false;
        }
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected successfully');
        return true;
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('⚠️  Falling back to in-memory storage');
        return false;
    }
};
export default mongoose;
//# sourceMappingURL=database.js.map