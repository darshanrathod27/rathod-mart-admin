import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const clearIndexes = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB\n");

    // List of collections to clear indexes from
    const collections = [
      "products",
      "variantmasters",
      "productsizeMappings",
      "productcolormappings",
      "categories",
      "inventoryledgers",
    ];

    console.log("🗑️  Dropping duplicate indexes...\n");

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);

        // Check if collection exists
        const collectionExists = await mongoose.connection.db
          .listCollections({ name: collectionName })
          .hasNext();

        if (!collectionExists) {
          console.log(
            `⚠️  Collection "${collectionName}" does not exist - skipping`
          );
          continue;
        }

        // Drop all indexes except _id
        await collection.dropIndexes();
        console.log(`✅ Dropped indexes from "${collectionName}"`);
      } catch (error) {
        if (error.code === 26) {
          console.log(
            `⚠️  Collection "${collectionName}" has no indexes to drop`
          );
        } else {
          console.log(`❌ Error with "${collectionName}": ${error.message}`);
        }
      }
    }

    console.log("\n✅ Index cleanup complete!");
    console.log("🔄 Now restart your server to recreate indexes properly.\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

clearIndexes();
