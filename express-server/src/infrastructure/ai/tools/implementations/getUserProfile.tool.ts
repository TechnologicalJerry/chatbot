import { z } from "zod";
import { ITool, ToolExecutionContext } from "../tool.interface";
import UserModel from "../../../../modules/users/user.model";

export class GetUserProfileTool implements ITool {
  public name = "get_user_profile";
  public description = "Get authenticated user profile details (read-only).";
  public inputSchema = z.object({});

  async execute(args: any, context: ToolExecutionContext): Promise<any> {
    const user = await UserModel.findById(context.userId).lean();
    if (!user) {
      return { error: "User profile not found" };
    }

    // Sanitize user output - exclude sensitive security fields
    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}

export default GetUserProfileTool;
