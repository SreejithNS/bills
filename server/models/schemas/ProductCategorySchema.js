const { Schema } = require("mongoose");

const ProductCategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            default: "general",
        },
        belongsTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        hasAccess: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: []
        }
    },
    { timestamps: true }
);

ProductCategorySchema.index({ name: 1, belongsTo: 1 }, { unique: true });

module.exports = ProductCategorySchema;