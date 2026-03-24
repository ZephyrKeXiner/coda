import OpenAI from "openai"

export const toolDefination: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read local file content",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path when you need to read"
          },
        },
        required: [ "path" ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "List the directory's content",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The directory path that you want to know the file in it"
          },
        },
        required: [ "path" ]
      }
    }
  }
]