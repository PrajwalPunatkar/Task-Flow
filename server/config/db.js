import mongoose from 'mongoose'

const connectDB = async () => {
  const { MONGODB_URI } = process.env

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env before starting the server.')
  }

  await mongoose.connect(MONGODB_URI)
  console.log(`MongoDB connected successfully (database: ${mongoose.connection.name}).`)
}

export default connectDB
