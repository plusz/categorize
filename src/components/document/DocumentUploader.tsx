import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import tippy from 'tippy.js';
import { useEffect } from 'react';

interface DocumentUploaderProps {
  onSubmit: (fileData: string, categories: string[], authCode: string) => Promise<void>;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<string>('');
  const [authCode, setAuthCode] = useState<string>('');
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (tooltipRef.current) {
      tippy(tooltipRef.current, {
        allowHTML: true,
      });
    }
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      handleFileValidation(selectedFile);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0];
      handleFileValidation(droppedFile);
    }
  };

  const handleFileValidation = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    if (selectedFile.size > 512 * 1024) {
      alert('File size must be less than 512kB.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setFile(selectedFile);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Please select a file.');
      return;
    }
    
    if (!authCode) {
      alert('Auth code is required. Please contact us for more credits.');
      return;
    }

    const categoryList = categories
      .split('\n')
      .map(category => category.trim().replace(/[^a-zA-Z0-9\s]/g, ''))
      .filter(category => category !== '');
    
    if (categoryList.length > 10) {
      alert('You can only have up to 10 non-empty categories.');
      return;
    }

    if (categoryList.length === 0) {
      alert('Categories must contain only letters and numbers, and not be empty.');
      return;
    }

    try {
      setIsLoading(true);
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const base64Data = event.target.result.split(',')[1];
          await onSubmit(base64Data, categoryList, authCode);
        }
      };
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title is-2">Document Categorizer</h1>
      <div className="box">
        <p className="mb-4">
          This is a demo of an API powered by a Large Language Model (LLM) designed for intelligent document 
          categorization and processing. The solution can seamlessly integrate into larger systems, 
          automating workflows and enhancing document management processes.
        </p>
        
        <div 
          className="file is-boxed is-centered mb-4"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label className="file-label">
            <input 
              className="file-input" 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <span className="file-cta">
              <span className="file-icon">
                <FontAwesomeIcon icon={faUpload} />
              </span>
              <span className="file-label">
                {file ? `File: ${file.name}` : 'Drag & Drop your document here or click to upload'}
              </span>
            </span>
          </label>
        </div>
        
        <div className="field">
          <label className="label">Categories</label>
          <div className="control">
            <textarea 
              className="textarea" 
              rows={6} 
              placeholder="Enter max 10 categories, one per line"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>
        </div>
        
        <div className="field">
          <label className="label">
            Authorization
            <span 
              className="icon tooltip-target ml-2" 
              ref={tooltipRef}
              data-tippy-content="To receive Auth code, please contact authors.<br>Details on 'About' page."
            >
              <FontAwesomeIcon icon={faEye} />
            </span>
          </label>
          <div className="field has-addons">
            <div className="control is-expanded">
              <input 
                className="input" 
                type={isPasswordVisible ? 'text' : 'password'} 
                placeholder="Enter your authorization code"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
              />
            </div>
            <div className="control">
              <button 
                className="button is-light" 
                onClick={togglePasswordVisibility}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={isPasswordVisible ? faEyeSlash : faEye} />
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="field mt-5">
          <div className="control">
            <button 
              className={`button is-primary is-fullwidth ${isLoading ? 'is-loading' : ''}`}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              Categorize Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploader;
