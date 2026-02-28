import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a data normalization engine for an enterprise workforce management platform called UNIFY.

You will receive one or more CSV files (raw text). Your job is to analyze them regardless of their format or column names and extract/infer data that maps to the following schema. Be smart about column mapping — headers may use different names than the schema.

Return ONLY a single valid JSON object (no markdown, no code fences, no explanation) with this exact shape:

{
  "employees": [
    { "name": string, "role": string, "email": string, "capacity": number }
  ],
  "departments": [
    { "name": string }
  ],
  "projects": [
    { "name": string, "description": string, "status": "Not Started"|"In Progress"|"Completed", "startDate": "ISO8601", "endDate": "ISO8601" }
  ],
  "tasks": [
    { "title": string, "type": string, "assigneeName": string, "projectName": string, "status": "To Do"|"In Progress"|"Review"|"Done", "weight": number (1-10), "startDate": "ISO8601", "endDate": "ISO8601" }
  ],
  "transactions": [
    { "Date": "YYYY-MM-DD", "Amount": number, "Type": "Revenue"|"Expense", "Category": string }
  ]
}

Rules:
- If a CSV has employee/people data → populate employees and departments
- If a CSV has project/sprint/milestone data → populate projects and tasks
- If a CSV has financial/revenue/expense/sales data → populate transactions
- Weight tasks by complexity or priority if present, default to 5
- If dates are missing, spread tasks/projects across today + next 30 days realistically
- Deduplicate entries if the same entity appears in multiple CSVs
- If a field cannot be inferred, use sensible defaults
- Always return all 5 arrays (can be empty [])
- Total response must be valid JSON parseable by JSON.parse()`;

export async function POST(req: NextRequest) {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
        }

        const body = await req.json();
        const csvContents: string[] = body.csvContents; // array of raw CSV strings

        if (!csvContents || csvContents.length === 0) {
            return NextResponse.json({ error: 'No CSV content provided' }, { status: 400 });
        }

        const userContent = csvContents
            .map((csv, i) => `=== CSV FILE ${i + 1} ===\n${csv}`)
            .join('\n\n');

        const geminiPayload = {
            contents: [
                {
                    parts: [
                        { text: SYSTEM_PROMPT },
                        { text: '\n\nHere are the CSV files to normalize:\n\n' + userContent }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
            }
        };

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error:', errText);
            return NextResponse.json({ error: `Gemini API error: ${response.status}` }, { status: 502 });
        }

        const geminiResult = await response.json();
        const rawText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Parse and validate
        let normalized;
        try {
            normalized = JSON.parse(rawText);
        } catch {
            // Try to extract JSON from markdown code fences if present
            const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match) normalized = JSON.parse(match[1]);
            else throw new Error('Could not parse Gemini JSON response');
        }

        // Ensure all arrays exist
        const safe = {
            employees: Array.isArray(normalized.employees) ? normalized.employees : [],
            departments: Array.isArray(normalized.departments) ? normalized.departments : [],
            projects: Array.isArray(normalized.projects) ? normalized.projects : [],
            tasks: Array.isArray(normalized.tasks) ? normalized.tasks : [],
            transactions: Array.isArray(normalized.transactions) ? normalized.transactions : [],
        };

        return NextResponse.json(safe);

    } catch (err: any) {
        console.error('normalize-csv error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
