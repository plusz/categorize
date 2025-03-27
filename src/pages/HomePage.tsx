import React, { useState } from "react";
import DocumentUploader from "../components/document/DocumentUploader";
import ResultDisplay from "../components/document/ResultDisplay";
import { categorizePdf } from "../services/documentService";

const HomePage: React.FC = () => {
	const [result, setResult] = useState<Record<string, any> | null>(null);

	const handleSubmit = async (fileData: string, categories: string[], authCode: string) => {
		try {
			const response = await categorizePdf(fileData, categories, authCode);
			setResult(response.jsonResponse);
		} catch (error) {
			console.error("Error categorizing document:", error);
			alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	};

	return (
		<section className="section">
			<div className="container">
				<DocumentUploader onSubmit={handleSubmit} />
				<div className="container mt-5">
					<ResultDisplay result={result} />
				</div>
			</div>
		</section>
	);
};

export default HomePage;
