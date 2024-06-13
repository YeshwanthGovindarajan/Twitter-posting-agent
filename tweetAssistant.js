import fs from 'fs';
import { OpenAI } from 'openai';
import promptSync from 'prompt-sync';
import dotenv from 'dotenv';
dotenv.config();

const prompt = promptSync();
const apiKey = process.env.OPENAI_API_KEY;
const client = new OpenAI({ apiKey });
const assistantId = "asst_GwIkOiwDBsurDx6iIgbLt5D0";
const threadId = "thread_CuhdRKTsTtfwzufWH1sX0w4Y";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createPost(tweet) {
  console.log("Tweet is being posted:", tweet);
  return tweet;
}

async function createAssistant() {
  try {
    const assistant = await client.beta.assistants.create({
      model: 'gpt-3.5-turbo-0613',
      name: 'Twitter Posting Agent',
      instructions: `This assistant helps with crafting tweets and posts. It answers questions, keeps responses relevant, 
                      and manages tweet postings as per user requests.`,
      tools: [{
        type: "function",
        function: {
          name: "create_post",
          description: "Posts a tweet based on user or assistant's input",
          parameters: {
            type: "object",
            properties: {
              tweet: {
                type: "string",
                description: "Tweet to be posted"
              }
            },
            required: ["tweet"]
          }
        }
      }],
    });
    return assistant;
  } catch (error) {
    console.error('Error creating assistant:', error);
    throw error;
  }
}

async function manageTweets() {
  let assistant = await createAssistant();
  console.log("Assistant created:", assistant);
  let userInput = prompt("Input 'quit' to stop or type your message: ");
  
  while (userInput.toLowerCase() !== "quit") {
    const message = await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: userInput
    });
    console.log("Message sent to thread:", message);

    try {
      console.log("Processing...");
      let run = await client.beta.threads.runs.create(threadId, { assistant_id: assistantId });
      
      while (run.status === "requires_action") {
        // Simulate action required processing here
        console.log("Action required...");
      }

      while (run.status !== "completed") {
        await sleep(1000);
        run = await client.beta.threads.runs.retrieve(threadId, run.id);
        console.log("Current run status:", run.status);
      }
      
      console.log("Run completed");
      const threadMessages = await client.beta.threads.messages.list(threadId);
      console.log("Thread Messages:", threadMessages.data[0]["content"]);
      
    } catch (error) {
      console.error('Error processing thread:', error);
    }

    userInput = prompt("Input 'quit' to stop or type your message: ");
  }
}

manageTweets();
