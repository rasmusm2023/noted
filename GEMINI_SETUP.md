# Gemini AI Integration Setup

## 🔐 Secure API Key Configuration

To use Gemini AI for task division, you need to set up your API key securely using environment variables.

### Step 1: Create Environment File

Create a `.env` file in your project root (same level as `package.json`):

```bash
# .env file
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 2: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the key and replace `your_actual_gemini_api_key_here` in your `.env` file

### Step 3: Security Best Practices

✅ **DO:**

- Add `.env` to your `.gitignore` file (already done)
- Use environment variables for API keys
- Never commit API keys to version control
- Use different keys for development/production

❌ **DON'T:**

- Put API keys directly in your code
- Share API keys in chat/email
- Commit `.env` files to git

### Step 4: Verify Setup

The AI service will automatically:

- ✅ Use Gemini AI when API key is available
- ✅ Fall back to smart simulation if API key is missing
- ✅ Handle API errors gracefully
- ✅ Show helpful console warnings if misconfigured

### Step 5: Test the Integration

1. Create a task with 11+ subtasks
2. Open the task drawer
3. Look for the "Consider dividing this task" suggestion
4. Click "Divide with AI" to test Gemini integration

## 🚀 Features

- **Real AI Analysis**: Gemini analyzes your subtasks and creates intelligent groupings
- **Smart Fallback**: Falls back to pattern-based simulation if Gemini is unavailable
- **Secure**: API key stored in environment variables, never in code
- **Error Handling**: Graceful degradation if API calls fail
- **Cost Efficient**: Uses Gemini 1.5 Flash for fast, affordable responses

## 🔧 Troubleshooting

**Issue**: "Gemini API not configured" warning
**Solution**: Check that your `.env` file exists and contains `VITE_GEMINI_API_KEY=your_key`

**Issue**: API calls failing
**Solution**: Verify your API key is valid and has sufficient quota

**Issue**: Still using simulation
**Solution**: Restart your development server after adding the `.env` file
