
import React, { useState } from 'react';
import './App.css';
import { processFNOL } from './logic/processor';

const sampleFNOL = `
*** FIRST NOTICE OF LOSS ***

Policy Information:
- Policy Number: POL-123456789
- Policyholder Name: John Doe
- Effective Dates: 01/01/2025 - 01/01/2026

Incident Information:
- Date: 2026-02-01
- Time: 14:30
- Location: 123 Main St, Anytown, USA
- Description: Minor fender bender in a parking lot. The other party's vehicle reversed into mine while I was stationary. Third party seemed apologetic.

Involved Parties:
- Claimant: John Doe
- Contact Details: john.doe@email.com, 555-123-4567
- Third Parties: Jane Smith, 555-987-6543

Asset Details:
- Asset Type: Vehicle
- Asset ID: ABC-1234
- Estimated Damage: $1,500

Other Mandatory Fields:
- Claim Type: Auto
- Attachments: photo1.jpg, police_report.pdf
`;

const App: React.FC = () => {
    const [fnolText, setFnolText] = useState<string>(sampleFNOL);
    const [result, setResult] = useState<object | null>(null);

    const handleProcessClick = () => {
        const output = processFNOL(fnolText);
        setResult(output);
    };

    return (
        <div className="app-container">
            <header>
                <h1>Autonomous Claims Processor</h1>
                <p>Paste an FNOL document below to extract fields and determine the claim route.</p>
            </header>
            <main>
                <div className="input-section">
                    <h2>FNOL Document Input</h2>
                    <textarea
                        value={fnolText}
                        onChange={(e) => setFnolText(e.target.value)}
                        placeholder="Paste FNOL text here..."
                    />
                    <button className="process-button" onClick={handleProcessClick}>
                        Process Claim
                    </button>
                </div>
                <div className="output-section">
                    <h2>Processing Result (JSON)</h2>
                    <pre>
                        {result ? JSON.stringify(result, null, 2) : 'Awaiting processing...'}
                    </pre>
                </div>
            </main>
        </div>
    );
};

export default App;
