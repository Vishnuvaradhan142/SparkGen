# Sparkgen Setup Guide

## AI Service Configuration

### Current Status
The application is working but currently using **fallback/mock responses** for the AI chat because the OpenRouter API key is not configured.

### Getting Real AI Responses

To enable real AI responses, you need to set up an OpenRouter API key:

#### Step 1: Create an OpenRouter Account
1. Visit https://openrouter.ai/
2. Sign up for a free account
3. Click on "Keys" in the top navigation

#### Step 2: Generate an API Key
1. In the Keys section, click "Create new key"
2. Give it a name like "Sparkgen Development"
3. Copy the generated API key

#### Step 3: Update Your Environment Variables
1. Open `server/.env` in your text editor
2. Find this line:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```
3. Replace `your_openrouter_api_key` with your actual API key from Step 2
4. Save the file

#### Step 4: Restart the Server
```bash
# Kill the running server (Ctrl+C)
# Then restart it:
npm run dev
```

#### Step 5: Test the Chat
1. Go to http://localhost:5173 in your browser
2. Click the chat bubble in the bottom right
3. Send a message - you should now get real AI responses!

### What Changes When You Add the API Key
✅ Chat responses will be powered by DeepSeek R1 AI  
✅ Personalized help based on your questions  
✅ Step-by-step learning guidance  
✅ Subject-specific explanations  

### Fallback Behavior
If the API key is not set or the service is unavailable, the application will:
- Continue working normally
- Provide helpful mock responses for the chat
- Show friendly guidance messages

This means **the app never breaks** - it gracefully falls back to useful default responses.

### Alternative AI Providers
If you prefer, you can also use:
- **OpenAI** (set `OPENAI_API_KEY` in .env)
- **Anthropic** (set `ANTHROPIC_API_KEY` in .env)

The system will try each provider in order (OpenRouter → OpenAI → Anthropic).

### Troubleshooting

**Issue: "No cookie auth credentials found" error**
- Solution: Make sure your API key is correctly copied without extra spaces

**Issue: 401 Unauthorized**
- Solution: Verify your API key is valid at https://openrouter.ai/keys

**Issue: Rate limiting**
- Solution: OpenRouter free tier has usage limits. Wait a few minutes or upgrade your account.

### Questions?
- OpenRouter Docs: https://openrouter.ai/docs
- Contact OpenRouter Support: https://openrouter.ai/

---

**For now**, the application works perfectly with mock responses. Add an API key whenever you're ready for live AI responses!
