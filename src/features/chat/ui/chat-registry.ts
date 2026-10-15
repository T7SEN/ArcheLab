import chatTagsJson from "@/data/chat-tags.json";
import { createRegistry } from "@/features/chat/engine";

/** The verified chat registry, shared by the builder's server and client code. */
export const chatRegistry = createRegistry(chatTagsJson);
