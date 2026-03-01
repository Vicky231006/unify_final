import { NextRequest } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Max 50 rows per CSV to keep tokens minimal
function truncate(csv: string, maxRows = 50): string {
    const lines = csv.trim().split('\n').filter(l => l.trim());
    if (lines.length <= maxRows + 1) return csv;
    return lines.slice(0, maxRows + 1).join('\n');
}

const PROMPT = `Convert these CSV files to JSON. Return ONLY valid JSON, no markdown, no explanation.

Schema:
{"employees":[{"name":"","role":"","email":"","capacity":100}],"departments":[{"name":""}],"projects":[{"name":"","description":"","status":"Not Started","startDate":"2024-01-01T00:00:00Z","endDate":"2024-01-31T00:00:00Z"}],"tasks":[{"title":"","type":"Task","assigneeName":"","projectName":"","status":"To Do","weight":5,"startDate":"2024-01-01T00:00:00Z","endDate":"2024-01-07T00:00:00Z"}],"transactions":[{"Date":"2024-01-01","Amount":0,"Type":"Revenue","Category":""}]}

- status options — project: "Not Started"|"In Progress"|"Completed", task: "To Do"|"In Progress"|"Review"|"Done", transaction type: "Revenue"|"Expense"
- Map column headers intelligently, employee CSVs → employees+departments, project/task CSVs → projects+tasks, financial CSVs → transactions
- Always return all 5 arrays (empty [] if not applicable)`;

// SSE helper
function sseMsg(data: object): string {
    return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (obj: object) => {
                controller.enqueue(encoder.encode(sseMsg(obj)));
            };

            try {
                if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
                    send({ status: 'error', error: 'GEMINI_API_KEY not configured', code: 503 });
                    controller.close();
                    return;
                }

                const body = await req.json();
                const csvContents: string[] = body.csvContents;

                if (!csvContents?.length) {
                    send({ status: 'error', error: 'No CSV content provided', code: 400 });
                    controller.close();
                    return;
                }

                const userContent = csvContents
                    .map((csv, i) => `=== FILE ${i + 1} ===\n${truncate(csv)}`)
                    .join('\n\n');

                const payload = JSON.stringify({
                    contents: [{ parts: [{ text: PROMPT }, { text: '\nCSV:\n' + userContent }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 2048, responseMimeType: 'application/json' }
                });

                // Retry strategy: up to 4 attempts with increasing delays
                const DELAYS = [0, 5000, 15000, 30000]; // ms gaps before each attempt
                let lastError = '';

                for (let attempt = 0; attempt < DELAYS.length; attempt++) {
                    const delay = DELAYS[attempt];

                    if (delay > 0) {
                        send({ status: 'retrying', attempt, waitMs: delay, message: `Rate limited — retrying in ${delay / 1000}s...` });
                        await new Promise(r => setTimeout(r, delay));
                    } else {
                        send({ status: 'processing', message: 'Sending to Gemini...' });
                    }

                    let res: Response;
                    try {
                        res = await fetch(GEMINI_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: payload,
                        });
                    } catch (networkErr: any) {
                        lastError = `Network error: ${networkErr.message}`;
                        send({ status: 'retrying', attempt, message: lastError });
                        continue;
                    }

                    if (res.status === 429) {
                        const retryAfter = res.headers.get('Retry-After');
                        lastError = `Rate limited (429)${retryAfter ? ` — retry after ${retryAfter}s` : ''}`;
                        // If this was the last attempt, give up
                        if (attempt === DELAYS.length - 1) {
                            send({ status: 'error', error: '429 — quota exceeded. Your client-side parsed data will be used instead.', code: 429 });
                            controller.close();
                            return;
                        }
                        continue; // try again after delay
                    }

                    if (!res.ok) {
                        const text = await res.text();
                        send({ status: 'error', error: `Gemini error ${res.status}`, code: res.status });
                        controller.close();
                        return;
                    }

                    // Success
                    const json = await res.json();
                    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

                    let normalized: any;
                    try {
                        normalized = JSON.parse(rawText);
                    } catch {
                        const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
                        normalized = match ? JSON.parse(match[1]) : {};
                    }

                    const safe = {
                        employees: Array.isArray(normalized.employees) ? normalized.employees : [],
                        departments: Array.isArray(normalized.departments) ? normalized.departments : [],
                        projects: Array.isArray(normalized.projects) ? normalized.projects : [],
                        tasks: Array.isArray(normalized.tasks) ? normalized.tasks : [],
                        transactions: Array.isArray(normalized.transactions) ? normalized.transactions : [],
                    };

                    send({ status: 'done', result: safe });
                    controller.close();
                    return;
                }

                // Exhausted all retries
                send({ status: 'error', error: lastError || 'All retries exhausted', code: 429 });
                controller.close();

            } catch (err: any) {
                controller.enqueue(encoder.encode(sseMsg({ status: 'error', error: err.message || 'Internal error', code: 500 })));
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
