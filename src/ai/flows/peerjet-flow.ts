
'use server';
/**
 * @fileOverview A Genkit flow for AI-powered teammate matching.
 * This flow is designed to rank a pre-filtered list of users, not to perform a broad search.
 * - findPeers - A function that takes a search query and a small list of user candidates,
 *   and returns a sorted list of those users based on skill/interest relevance.
 */
import { ai } from '@/ai/init';
import {
  PeerSearchInputSchema,
  PeerSearchOutputSchema,
  type PeerSearchInput,
  type PeerSearchOutput,
} from '@/ai/schemas/peer-schema';
import { z } from 'genkit';

// This prompt performs the user ranking. It does NOT filter.
const peerSearchPrompt = ai.definePrompt({
  name: 'peerSearchPrompt',
  input: { schema: PeerSearchInputSchema },
  output: { schema: PeerSearchOutputSchema },
  prompt: `You are an expert at building hackathon teams. Your task is to rank the provided list of candidates based on a user's request. Do not filter the list, only rank the users you are given.

The user's search query is: "{{query}}"

The user making the request has the following profile:
- Name: {{currentUser.full_name}}
- Skills: {{#if currentUser.tech_stack}}{{#each currentUser.tech_stack}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- Interests: {{#if currentUser.interests}}{{#each currentUser.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}

Here is the EXACT list of candidates to rank. Do not add or remove anyone.
{{#each users}}
- User ID: {{id}}
  - Name: {{full_name}}
  - Gender: {{gender}}
  - Bio: {{bio}}
  - Skills: {{#if tech_stack}}{{#each tech_stack}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
  - Interests: {{#if interests}}{{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
{{/each}}

1.  **Analyze & Rank:** Evaluate each candidate against the query. Prioritize users whose skills and interests directly match the keywords in the query. Consider complementary skills. For example, if the query asks for a "female designer", rank female candidates with design skills higher.
2.  **Output:** Return a JSON array of ALL the candidates you were given, sorted by relevance. Each object must include the user's ID ('userId'), a brief 'reason' for the ranking, and a 'match_score' from 0 to 1. Do not include the current user in the results. If no one is a good match, return them with low scores.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

// The wrapper function that calls the flow
export async function findPeers(
  input: PeerSearchInput
): Promise<PeerSearchOutput | string> {
  return peerSearchFlow(input);
}

// The Genkit flow definition
const peerSearchFlow = ai.defineFlow(
  {
    name: 'peerSearchFlow',
    inputSchema: PeerSearchInputSchema,
    outputSchema: z.union([PeerSearchOutputSchema, z.string()]),
  },
  async (input) => {
    // This flow is now simpler. The client-side logic does the pre-filtering and triage.
    // This flow's only job is to rank the provided batch of users.

    if (!input.users || input.users.length === 0) {
      return "No users were provided to rank. Please try a broader search on the client side.";
    }

    const { output: searchOutput } = await peerSearchPrompt(input, {
      model: 'googleai/gemini-2.0-flash',
    });
    
    return searchOutput || [];
  }
);
