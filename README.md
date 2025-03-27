# Document Categorization API Demo - React Version

A modern React application for intelligent document categorization using Large Language Models (LLMs). This application allows users to
upload PDF documents and receive AI-powered categorization based on user-defined categories.

## About This Project

This is a demo of an API powered by a **Large Language Model (LLM)** designed for intelligent document categorization and processing. The
solution can seamlessly integrate into larger systems, automating workflows and enhancing document management processes.

✨ **Project Evolution:** The original application was created without manually writing code—only using commands provided to
ChatGPT/Perplexity with minor code fixes. The React conversion was performed by [kacpep.dev](https://kacpep.dev) and took only 10 minutes
using Claude 3.7 Sonnet and Windsurf.

### Key Features

- **Document Categorization:** Automatically classify documents based on their content
- **PDF document upload** (up to 512KB)
- **User-defined categorization schema** (up to 10 categories)
- **Validation Checks:** Identify the presence of required stamps or signatures
- **Custom Actions:** Forward documents to specific teams or individuals, or register tasks based on document content
- **Sentiment Analysis:** Analyze the sentiment conveyed in the document's text
- **Flexible Storage:** Store processed results in your preferred database, filesystem, or spreadsheet
- **Responsive UI:** Modern user interface built with React and Bulma CSS

This API can process multiple documents at once and adapt to your organization's needs, making it a versatile tool for document automation.

## Tech Stack

- React with TypeScript for frontend
- Bulma CSS framework for styling
- Google's Generative AI (Gemini-2.0-flash) for document analysis
- FaunaDB for authorization and credit management
- Netlify Functions for serverless API endpoints

## Installation and Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/plusz/categorize.git
   cd categorize-react
   ```

2. Install dependencies:

   ```bash
   npm install
   # or if using pnpm
   pnpm install
   ```

3. Set up environment variables: Create a `.env` file in the project root with the following variables:

   ```
   GOOGLE_API_KEY=your_google_api_key
   FAUNA_SECRET=your_fauna_secret
   ```

4. Start the development server:
   ```bash
   npm start
   # or if using pnpm
   pnpm start
   ```

## Usage

1. Upload a PDF document using the drag-and-drop area or file selection button
2. Enter up to 10 categories, one per line in the categories field
3. Enter your authorization code (contact administrators for access)
4. Click "Upload and Categorize"
5. View the AI-generated categorization results

## Deployment

This project is set up for deployment on Netlify:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the application
npm run build

# Deploy to Netlify
netlify deploy
```

## License

ISC - See LICENSE file for details.

## Project Information

⏱️ **Original Development Time:** 4 hours _(70% of the time resolving issues with authorization and Fauna DB due to incorrect code from
LLM)_

**Integrated systems:** Netlify, Fauna DB, Gemini-2.0-flash

> **Note:** This is a demo version showcasing the capabilities of the API. It can be customized and scaled to fit your business requirements
> as part of a larger system.

## Contact

📧 **Contact:** `piotr [at] orpi.pl`

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.
