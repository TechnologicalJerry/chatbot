import { z } from "zod";
import { ITool, ToolExecutionContext } from "../tool.interface";
import ProductModel from "../../../../modules/products/product.model";

export class SearchProductsTool implements ITool {
  public name = "search_products";
  public description = "Search catalog products by query string with bounded results.";
  public inputSchema = z.object({
    query: z.string().min(1).max(100),
    limit: z.number().min(1).max(5).default(5),
  });

  async execute(args: any, context: ToolExecutionContext): Promise<any> {
    const validated = this.inputSchema.parse(args);
    const limit = Math.min(validated.limit || 5, 5);

    const regex = new RegExp(validated.query, "i");
    const products = await ProductModel.find({
      $or: [{ title: regex }, { description: regex }],
    })
      .limit(limit)
      .lean();

    return products.map((p) => ({
      productId: p.productId || p._id,
      title: p.title,
      price: p.price,
      description: p.description?.substring(0, 150),
    }));
  }
}

export default SearchProductsTool;
