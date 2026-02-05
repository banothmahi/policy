
// This file contains the core logic for processing the FNOL document.

// --- 1. TYPE DEFINITIONS ---

interface ExtractedFields {
    // Using camelCase for keys in the JSON object
    policyNumber: string | null;
    policyholderName: string | null;
    effectiveDates: string | null;
    incidentDate: string | null;
    incidentTime: string | null;
    location: string | null;
    description: string | null;
    claimant: string | null;
    thirdParties: string | null;
    contactDetails: string | null;
    assetType: string | null;
    assetId: string | null;
    estimatedDamage: string | null; // The raw string value, e.g., "$1,500"
    claimType: string | null;
    attachments: string[] | null;
    // This is not directly extracted but derived from estimatedDamage for logic
    initialEstimate: number | null; 
}

interface RoutingResult {
    recommendedRoute: string;
    reasoning: string;
}

export interface FNOLOutput {
    extractedFields: Partial<ExtractedFields>; // Use Partial to allow for missing fields
    missingFields: string[];
    recommendedRoute: string;
    reasoning: string;
}

// --- 2. EXTRACTION LOGIC ---

/**
 * A simple helper to extract a value from a line based on a key.
 * E.g., "Policy Number: POL-123" -> "POL-123"
 * @param text The full FNOL text.
 * @param fieldName The name of the field to extract (e.g., "Policy Number").
 */
const extractField = (text: string, fieldName: string): string | null => {
    // Regex to find a line starting with the field name, followed by a colon, and capture the rest.
    // 'i' flag for case-insensitivity, 'm' for multi-line matching.
    const regex = new RegExp(`^\\s*-\\s*${fieldName}:\\s*(.+)`, "im");
    const match = text.match(regex);
    return match && match[1] ? match[1].trim() : null;
};

/**
 * Parses the estimated damage string (e.g., "$1,500" or "25000") into a number.
 * @param damageString The string to parse.
 */
const parseEstimate = (damageString: string | null): number | null => {
    if (!damageString) return null;
    // Remove non-numeric characters except for a decimal point.
    const numericString = damageString.replace(/[^0-9.]/g, '');
    const value = parseFloat(numericString);
    return isNaN(value) ? null : value;
};


// --- 3. ROUTING LOGIC ---

const getRoutingDecision = (fields: ExtractedFields, missingFields: string[]): RoutingResult => {
    // Rule 1: Missing mandatory fields (highest priority)
    if (missingFields.length > 0) {
        return {
            recommendedRoute: "Manual Review",
            reasoning: `Mandatory field(s) are missing or invalid: ${missingFields.join(", ")}. Claim requires manual data entry and validation.`,
        };
    }

    // Rule 2: Fraud keywords
    const fraudKeywords = ["fraud", "inconsistent", "staged"];
    const description = fields.description?.toLowerCase() || "";
    if (fraudKeywords.some(keyword => description.includes(keyword))) {
        return {
            recommendedRoute: "Investigation Flag",
            reasoning: "The claim description contains keywords suggesting potential fraud. It will be routed to the special investigation unit.",
        };
    }
    
    // Rule 3: Injury claim
    if (fields.claimType?.toLowerCase().includes("injury")) {
        return {
            recommendedRoute: "Specialist Queue",
            reasoning: "The claim is of type 'Injury' and requires handling by a specialist.",
        };
    }

    // Rule 4: Low damage amount
    // We can be sure initialEstimate is not null here because of the mandatory field check above.
    if (fields.initialEstimate! < 25000) {
        return {
            recommendedRoute: "Fast-track",
            reasoning: `The estimated damage of $${fields.initialEstimate} is below the $25,000 threshold for automated processing.`,
        };
    }

    // Default Rule: If no other rules match
    return {
        recommendedRoute: "Standard Review",
        reasoning: "The claim does not meet the criteria for any specialized queue. It will proceed through the standard review process.",
    };
};


// --- 4. MAIN PROCESSING FUNCTION ---

export const processFNOL = (text: string): FNOLOutput => {
    const attachmentsRaw = extractField(text, "Attachments");
    const estimatedDamageRaw = extractField(text, "Estimated Damage");

    const extractedFields: ExtractedFields = {
        policyNumber: extractField(text, "Policy Number"),
        policyholderName: extractField(text, "Policyholder Name"),
        effectiveDates: extractField(text, "Effective Dates"),
        incidentDate: extractField(text, "Date"),
        incidentTime: extractField(text, "Time"),
        location: extractField(text, "Location"),
        description: extractField(text, "Description"),
        claimant: extractField(text, "Claimant"),
        thirdParties: extractField(text, "Third Parties"),
        contactDetails: extractField(text, "Contact Details"),
        assetType: extractField(text, "Asset Type"),
        assetId: extractField(text, "Asset ID"),
        claimType: extractField(text, "Claim Type"),
        estimatedDamage: estimatedDamageRaw,
        attachments: attachmentsRaw ? attachmentsRaw.split(',').map(s => s.trim()) : null,
        initialEstimate: parseEstimate(estimatedDamageRaw),
    };

    // --- Identify Missing Mandatory Fields ---
    const missingFields: string[] = [];
    if (!extractedFields.claimType) {
        missingFields.push("Claim Type");
    }
    if (!extractedFields.attachments) {
        missingFields.push("Attachments");
    }
    // "Initial Estimate" is mandatory, which we derive from "Estimated Damage"
    if (extractedFields.initialEstimate === null) {
        missingFields.push("Initial Estimate (derived from Estimated Damage)");
    }

    // --- Get Routing Decision ---
    const { recommendedRoute, reasoning } = getRoutingDecision(extractedFields, missingFields);

    // --- Assemble Final Output ---
    // Create a cleaner object for the output, removing the derived 'initialEstimate' field
    const displayFields: Partial<ExtractedFields> = { ...extractedFields };
    delete (displayFields as any).initialEstimate;


    return {
        extractedFields: displayFields,
        missingFields,
        recommendedRoute,
        reasoning,
    };
};
