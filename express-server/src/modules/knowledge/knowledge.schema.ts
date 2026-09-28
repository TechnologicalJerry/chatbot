import { z } from "zod";

export const ingestDocumentSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: "Title is required",
    }).min(1).max(300),
    content: z.string({
      required_error: "Content is required",
    }).min(1),
    sourceType: z.enum(["text", "markdown", "file"]).default("text"),
  }),
});

export const deleteDocumentSchema = z.object({
  params: z.object({
    documentId: z.string({
      required_error: "Document ID is required",
    }),
  }),
});

export type IngestDocumentInput = z.infer<typeof ingestDocumentSchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
