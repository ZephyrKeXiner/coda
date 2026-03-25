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
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write content into file",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path that you want to write"
          },
          content: {
            type: "string",
            description: "The content that you want to write in the file"
          },
        },
        required: [ "path", "content" ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "grep",
      description: "Search for a keyword in the file content and return the matching lines",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The file path in which to search for the keyword"
          },
          keyword: {
            type: "string",
            description: "The keyword to search for in the file content"
          }
        },
        required: ["file_path", "keyword"]
      }
    }
  }
]