# Advice is deterministic; AI only builds the Knowledge Base

Next Actions are a pure function of the Account State and the Knowledge Base: no LLM runs at advice time. AI agents do the research that fills the Knowledge Base (wiki, community guides, Toolbox data; most recent and most official wins), and every entry cites a Source. We chose this because asking an LLM directly during play is what we do today, and it is inconsistent, hallucinates, and uses stale patch information; a deterministic engine over cited, versioned data gives the same answer every time and can be corrected in one place.
