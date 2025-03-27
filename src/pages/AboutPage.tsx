import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <section className="section">
      <div className="container">
        <h1 className="title">About Document Categorizer</h1>
        
        <div className="content">
          <h2>What is Document Categorizer?</h2>
          <p>
            Document Categorizer is a powerful tool that uses artificial intelligence to analyze and categorize PDF documents. 
            The system employs a Large Language Model (LLM) to understand document content and classify it according to user-defined categories.
          </p>
          
          <h2>How It Works</h2>
          <ol>
            <li>Upload a PDF document (max 512KB)</li>
            <li>Enter up to 10 categories</li>
            <li>Enter your authorization code</li>
            <li>Submit the document for processing</li>
            <li>Receive analysis results including document title, summary, matching categories, and suggested taxonomies</li>
          </ol>
          
          <h2>Technical Details</h2>
          <p>
            This application is built with modern web technologies including:
          </p>
          <ul>
            <li>React with TypeScript for a robust frontend</li>
            <li>Bulma CSS framework for responsive design</li>
            <li>Google's Generative AI for document analysis</li>
            <li>FaunaDB for secure authentication and credit management</li>
            <li>Serverless functions on Netlify for backend processing</li>
          </ul>
          
          <h2>Contact Information</h2>
          <p>
            For inquiries, authorization codes, or technical support, please contact:
          </p>
          <p>
            <strong>Email:</strong> support@example.com
          </p>
          
          <div className="mt-5">
            <Link to="/" className="button is-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPage;
