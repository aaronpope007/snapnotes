/** Quick hand templates for notes. Use `x` in backticks for card placeholders. */

export const HAND_TEMPLATE_PFR = `hero opens \`x\` \`x\` in the 
villain calls in 
flop 

turn 

river 
`;

export const HAND_TEMPLATE_VS_PFR = `villain opens \`x\` \`x\` from the 
hero 
flop 

turn 

river 
`;

export const HAND_TEMPLATES = [
  { id: 'pfr', label: 'PFR', text: HAND_TEMPLATE_PFR },
  { id: 'vsPfr', label: 'vs PFR', text: HAND_TEMPLATE_VS_PFR },
] as const;
