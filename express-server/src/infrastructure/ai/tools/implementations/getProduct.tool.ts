import { z } from "zod";
import { ITool, ToolExecutionContext } from "../tool.interface";
import ProductModel from "../../../../modules/products/product.model";

export class GetProductTool implements ITool {
  public name = "get_product";
  public description = "Get detailed information for a specific product by productId.";
  public inputSchema = z.object({
    productId: z.string().min(1),
  });

  async execute(args: any, context: ToolExecutionContext): Promise<any> {
    const validated = this.inputSchema.parse(args);
    const product = await ProductModel.findOne({
      $or: [{ productId: validated.productId }, { _id: validated.productId }],
    }).lean();

    if (!product) {
      return { error: "Product not found" };
    }

    return {
      productId: product.productId || product._id,
      title: product.title,
      price: product.price,
      description: product.description,
      image: product.image,
    };
  }
}

export default GetProductTool;
