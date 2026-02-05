# Autonomous Insurance Claims Processing Agent

This project is a lightweight system that processes FNOL (First Notice of Loss) insurance documents in PDF format.  
It extracts important claim details, checks for missing information, applies routing rules, and generates a JSON output for claim processing.

---

## 📌 Problem Statement

The goal of this project is to:

- Extract key fields from FNOL documents
- Identify missing or inconsistent information
- Classify claims based on predefined rules
- Route claims to the appropriate workflow
- Provide reasoning for the routing decision

This system helps automate the initial insurance claims handling process.

---

## 📌 Approach

### 1. PDF Text Extraction
The system uses the `pdfplumber` library to read and extract text from FNOL PDF documents.

### 2. Field Identification
Regular expressions (Regex) are used to locate and extract important fields such as:
- Policy Number
- Policyholder Name
- Date of Loss
- Location
- Accident Description
- Estimated Damage
- Claim Type

### 3. Missing Field Detection
All extracted fields are validated.  
If any mandatory field is empty or missing, it is added to the `missingFields` list.

### 4. Claim Routing Logic
The claim is routed based on the following rules:

| Condition | Route |
|-----------|--------|
| Damage < 25,000 | Fast-track |
| Missing fields | Manual Review |
| Contains "fraud" keyword | Investigation Flag |
| Injury claim | Specialist Queue |
| Otherwise | Standard Processing |

### 5. JSON Output Generation
The final result is displayed in JSON format containing:
- Extracted fields
- Missing fields
- Recommended route
- Reasoning

---

## 📁 Project Structure


