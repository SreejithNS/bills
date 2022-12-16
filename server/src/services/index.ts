import mongoose from "mongoose";

export default abstract class Service {
    public static entityName: string;

    public static permissions: string[];
    
    public static populateOptions: mongoose.PopulateOptions[];
}