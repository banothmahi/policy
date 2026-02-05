import React, { useState } from 'react';
import './App.css';

interface ClaimFields {
  policyNumber: string | null;
  policyholderName: string | null;
  dateOfLoss: string | null;
  location: string | null;
  description: string | null;
  estimatedDamage: string | null;
  claimType: string | null;
}

interface ProcessResult {
  extractedFields: ClaimFields;
  missingFields: string[];
  recommendedRoute: string;
  reasoning: string;
}

const initialClaimText = `POLICY NUMBER: 12345-ABC
NAME OF INSURED/POLICYHOLDER: John Doe
DATE OF LOSS/ACCIDENT (MM/DD/YYYY): 01/15/2026
CITY, STATE, ZIP: Anytown, CA, 90210
CLAIM TYPE: Auto
ESTIMATE AMOUNT: $2,300

DESCRIPTION OF ACCIDENT/LOSS:
The insured was rear-ended at a stoplight. He was stopped at the intersection of Main St and 1st Ave when a third party vehicle failed to stop and impacted the rear of the insured's vehicle. 
Police were called to the scene. No injuries reported at this time.`;

const App: React.FC = () => {
    const [claimText, setClaimText] = useState(initialClaimText);
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const extractFields = (text: string): ClaimFields => {
        const fields: ClaimFields = {
            policyNumber: null,
            policyholderName: null,
            dateOfLoss: null,
            location: null,
            description: null,
            estimatedDamage: null,
            claimType: null,
        };
    
        const search = (pattern: RegExp): string | null => {
            const match = text.match(pattern);
            return match && match[1] ? match[1].trim() : null;
        };
    
        fields.policyNumber = search(/POLICY NUMBER[:\s]*(.*)/i);
        fields.policyholderName = search(/NAME OF INSURED.*?[:\s]*(.*)/i);
        fields.dateOfLoss = search(/DATE OF LOSS.*?[:\s]*(.*)/i);
        fields.location = search(/CITY, STATE, ZIP[:\s]*(.*)/i);
        fields.estimatedDamage = search(/ESTIMATE AMOUNT[:\s]*(.*)/i);
        fields.claimType = search(/CLAIM TYPE[:\s]*(.*)/i);

        // Improved regex for potentially multi-line descriptions
        const descMatch = text.match(/DESCRIPTION OF ACCIDENT.*?[:\s]*([\s\S]*?)(?=ESTIMATE AMOUNT:|CLAIM TYPE:|POLICY NUMBER:|NAME OF INSURED|----------|$)/i);
        if (descMatch && descMatch[1]) {
            fields.description = descMatch[1].trim();
        }

        return fields;
    };

    const findMissingFields = (fields: ClaimFields): string[] => {
        const missing: string[] = [];
        // We consider description non-mandatory for this check
        const mandatoryFields: (keyof ClaimFields)[] = ['policyNumber', 'policyholderName', 'dateOfLoss', 'location', 'estimatedDamage', 'claimType'];
        mandatoryFields.forEach(key => {
            if (!fields[key]) {
                missing.push(key);
            }
        });
        return missing;
    };

    const routeClaim = (fields: ClaimFields, missing: string[]): { route: string; reason: string } => {
        const description = fields.description || "";
        const damageString = fields.estimatedDamage?.replace(/[$,]/g, '') || '';
        const claimType = fields.claimType || "";
        
        let damage: number | null = null;
        if (damageString) {
            const parsedDamage = parseFloat(damageString);
            if (!isNaN(parsedDamage)) {
                damage = parsedDamage;
            }
        }
        
        if (description.toLowerCase().includes("fraud")) {
            return { route: "Investigation Flag", reason: "Fraud keyword found" };
        }
    
        if (missing.length > 0) {
            const prettyMissing = missing.map(f => f.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
            return { route: "Manual Review", reason: `Missing mandatory fields: ${prettyMissing.join(', ')}` };
        }
    
        if (claimType.toLowerCase().includes("injury")) {
            return { route: "Specialist Queue", reason: "Injury claim" };
        }
    
        if (damage !== null && damage < 25000) {
            return { route: "Fast-track", reason: "Low damage estimate (< $25,000)" };
        }
    
        return { route: "Standard Processing", reason: "Claim meets standard criteria" };
    };

    const handleProcessClaim = () => {
        setIsLoading(true);
        setResult(null); 
        // Simulate processing time for a better user experience
        setTimeout(() => {
            const extracted = extractFields(claimText);
            const missing = findMissingFields(extracted);
            const { route, reason } = routeClaim(extracted, missing);
    
            setResult({
                extractedFields: extracted,
                missingFields: missing,
                recommendedRoute: route,
                reasoning: reason,
            });
            setIsLoading(false);
        }, 500);
    };

    const formatFieldName = (key: string) => {
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Claim Processing & Routing</h1>
          <p>This tool analyzes claim text to extract fields and recommend a processing route, based on the logic from your Python script.</p>
          <p className="disclaimer">Since I can't read PDF files directly in this environment, please paste the text from your claim document below.</p>
        </header>

        <main className="app-main">
          <div className="input-section">
            <h2>Claim Document Text</h2>
            <textarea
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="Paste your FNOL document text here..."
              className="claim-textarea"
            />
            <button onClick={handleProcessClaim} disabled={isLoading || !claimText}>
              {isLoading ? 'Processing...' : 'Process Claim'}
            </button>
          </div>
          
          {isLoading && <div className="output-section"><h2>Processing...</h2></div>}

          {result && (
            <div className="output-section">
              <h2>Processing Results</h2>
              <div className="result-card route-card">
                <h3>Recommended Route</h3>
                <p className="route">{result.recommendedRoute}</p>
                <p className="reasoning">{result.reasoning}</p>
              </div>
              
              <div className="result-card fields-card">
                <h3>Extracted Fields</h3>
                <ul>
                  {Object.entries(result.extractedFields).map(([key, value]) => (
                    <li key={key} className={!value ? 'missing-field' : ''}>
                      <strong>{formatFieldName(key)}:</strong> 
                      <span>{value || 'Not Found'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    );
};

export default App;
