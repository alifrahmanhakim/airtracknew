# Understanding AI Features with Genkit

All Artificial Intelligence (AI) capabilities in this application are built using **Genkit**. Genkit is a powerful, open-source framework from Firebase that helps developers create robust, production-quality AI features.

Think of Genkit as the backend engine for your app's AI. It handles the complex parts of interacting with large language models (LLMs), allowing you to focus on what you want to build.

## Core Concepts

In this project, you'll primarily interact with two core Genkit concepts, which are usually defined together in files under `src/ai/flows/`.

### 1. Flows

A **Flow** is a server-side function (`'use server'`) that orchestrates an AI task. It's the main entry point that your user interface (React components) will call to get an AI-powered result.

A flow can:
- Receive input from your app (like text, an image, or other data).
- Perform logic and prepare data for an AI model.
- Call one or more AI models.
- Process the output from the model.
- Return a final, structured result back to your app.

### 2. Prompts

A **Prompt** is a specific instruction template that you send to an AI model within a Flow. It tells the model exactly what you want it to do.

Key features of a Genkit Prompt:
- **Structured Input/Output**: You can define a precise structure (a "schema") for the data you send to the model and the data you expect back. This makes the AI's responses predictable and reliable.
- **Templating**: You can insert your input data directly into the prompt text.
- **Tool-Based**: You can give prompts "tools" (other functions you define) that the AI can decide to use if it needs more information to complete its task.

## How It Works in This App

1.  A user interacts with a component in the UI (e.g., clicks a "Summarize" button).
2.  The UI component calls a **Flow** function (e.g., `summarizeProjectFlow`).
3.  The Flow function runs on the server. It might fetch some data from Firestore first.
4.  The Flow then calls a **Prompt**, sending the data and instructions to a Google AI model.
5.  The AI model processes the request and sends a structured response back.
6.  The Flow returns this structured response to the UI component.
7.  The UI component displays the AI-generated result to the user.

While this project is configured to use Google's AI models, Genkit is designed to be model-agnostic. However, for our purposes, we will stick to the integrated Google models.
