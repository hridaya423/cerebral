![Cerebral Logo](public/logo.png)
# Cerebral

Cerebral is an intelligent audio processing application that converts conversations, meetings, lectures, and podcasts into actionable insights through advanced AI-powered transcription, analysis, and interactive chat capabilities.

## ✨ Features

### Multiple Input Sources
- **Live Recording**: Record audio directly in the browser with pause/resume functionality
- **File Upload**: Drag and drop audio files (MP3, WAV, M4A, OGG, WebM)
- **YouTube Processing**: Extract and process audio from YouTube videos

### Intelligent Analysis
- **Accurate Transcription**: High-quality speech-to-text conversion with confidence scoring
- **Automatic Summarization**: AI-generated summaries of key points
- **Topic Extraction**: Intelligent identification and categorization of discussion topics
- **Sentiment Analysis**: Emotional tone detection throughout conversations
- **Action Items Generation**: Automatic extraction of tasks and follow-ups

- **Multiple Export Formats**: PDF, Word, TXT, JSON, CSV


## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Groq API key for AI processing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hridaya423/cerebral.git
   cd cerebral
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

