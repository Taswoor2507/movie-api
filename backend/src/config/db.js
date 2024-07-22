
import mongoose  from "mongoose";


const connectDB = async ()=>{
    try {
     const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`)
     console.log(`mongoDB connect successfully ${connectionInstance.connection.host}`);   
    } catch (error) {
        console.log('DB is not connecting due to  --> ' ,  error);    
} 
}

export default connectDB;