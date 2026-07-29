const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-4-26b-a4b-it:free";

const SYSTEM_PROMPT = `You are an HR screening assistant. Compare a candidate's CV against a job description and respond with ONLY strict JSON, no markdown, no code fences, no extra commentary. The JSON must exactly match this shape:
{
  "matchPercent": <integer 0-100>,
  "pros": ["...", "..."],
  "cons": ["...", "..."],
  "suggestedQuestions": ["...", "...", "..."]
}
pros and cons should be short bullet-point strings. suggestedQuestions should contain 3 to 5 tailored interview questions for this candidate and job.`;

function buildUserPrompt(jobDescription, cvText) {
  return `Job description:\n${jobDescription}\n\nCandidate CV:\n${cvText}`;
}

function stripCodeFences(content) {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

async function callOpenRouter(messages) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`OpenRouter API request failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter API returned no content.");
  }
  return content;
}

function parseAnalysis(content) {
  const stripped = stripCodeFences(content);
  const parsed = JSON.parse(stripped);

  if (
    typeof parsed.matchPercent !== "number" ||
    !Array.isArray(parsed.pros) ||
    !Array.isArray(parsed.cons) ||
    !Array.isArray(parsed.suggestedQuestions)
  ) {
    throw new Error("AI response did not match the expected shape.");
  }

  return {
    matchPercent: Math.max(0, Math.min(100, Math.round(parsed.matchPercent))),
    pros: parsed.pros,
    cons: parsed.cons,
    suggestedQuestions: parsed.suggestedQuestions,
  };
}

// Calls the AI model to compare a job description against CV text, returning
// { matchPercent, pros, cons, suggestedQuestions }. Retries once with a
// stricter instruction if the first response isn't valid JSON, then throws.
export async function analyzeCandidate(jobDescription, cvText) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(jobDescription, cvText) },
  ];

  const firstContent = await callOpenRouter(messages);

  try {
    return parseAnalysis(firstContent);
  } catch {
    const retryMessages = [
      ...messages,
      { role: "assistant", content: firstContent },
      {
        role: "user",
        content:
          "Your previous response was not valid JSON matching the required shape. Respond again with ONLY the raw JSON object, no markdown formatting, no code fences, no explanation.",
      },
    ];

    const secondContent = await callOpenRouter(retryMessages);
    return parseAnalysis(secondContent);
  }
}
