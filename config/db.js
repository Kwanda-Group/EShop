// config/db.js
import mongoose from 'mongoose';
import Grid from 'gridfs-stream';


let gridfsBucket = null;
let gfs = null;


export async function connectDB(mongoUri) {
await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
const conn = mongoose.connection;
Grid.mongo = mongoose.mongo;
conn.once('open', () => {
gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'videos' });
gfs = Grid(conn.db, mongoose.mongo);
gfs.collection('videos');
console.log('MongoDB connected and GridFS ready');
});
}


export function getGridFSBucket() {
if (!gridfsBucket) throw new Error('GridFSBucket not initialized');
return gridfsBucket;
}


export function getGFS() {
if (!gfs) throw new Error('gfs not initialized');
return gfs;
}