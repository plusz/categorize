import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import Navbar from "./components/layout/Navbar";
import "bulma/css/bulma.min.css";

function App() {
	return (
		<BrowserRouter>
			<div className="App">
				<header>
					<Navbar />
				</header>
				<main>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/about" element={<AboutPage />} />
					</Routes>
				</main>
			</div>
		</BrowserRouter>
	);
}

export default App;
