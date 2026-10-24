// Node maps for each system's interactive canvas.
// Columns sit at x = 30, 260, 490, 720, 950, 1180. Rows go from about y = 40 to 340.
// steps: { start: nodeId } fires a trigger; { go: ["a>b", ...] } sends data along those wires.
// off: true draws a dashed branch that the replay doesn't take.

window.GRAPHS = {
  negotiation: {
    file: "negotiation-agent.json",
    nodes: [
      { id: "gmail", x: 30, y: 197, ico: "@", lbl: "Gmail Trigger", sub: "vendor reply in" },
      { id: "first", x: 260, y: 197, ico: "?", lbl: "Is First Reply?", sub: "IF · route by thread" },
      { id: "research", x: 490, y: 90, ico: "AI", lbl: "Vendor Research", sub: "agent · score vendor" },
      { id: "parser", x: 490, y: 306, ico: "{}", lbl: "Price Parser", sub: "agent · read quote" },
      { id: "classify", x: 720, y: 197, ico: "≡", lbl: "Scenario Router", sub: "quote · counter · no" },
      { id: "brain", x: 950, y: 197, ico: "ƒ", lbl: "Strategy + Math", sub: "LLM moves · JS math" },
      { id: "send", x: 1180, y: 110, ico: "→", lbl: "Humanize + Send", sub: "reply in thread" },
      { id: "log", x: 1180, y: 290, ico: "▤", lbl: "Log + Chaser", sub: "sheet · follow-ups" },
    ],
    edges: [
      { a: "gmail", b: "first" },
      { a: "first", b: "research", label: "new" },
      { a: "first", b: "parser", label: "ongoing" },
      { a: "research", b: "classify" },
      { a: "parser", b: "classify" },
      { a: "classify", b: "brain" },
      { a: "brain", b: "send" },
      { a: "brain", b: "log" },
    ],
    steps: [
      { start: "gmail", log: [["gmail", "vendor reply received"]] },
      { go: ["gmail>first"], log: [["router", "existing thread → follow-up path"]] },
      { go: ["first>parser"], log: [["parser", "price pulled out of the thread"]] },
      { go: ["parser>classify"], log: [["classifier", "scenario: counter-offer"]] },
      { go: ["classify>brain"], log: [["strategy", "model picks the move · JavaScript computes the number"]] },
      { go: ["brain>send", "brain>log"], log: [["send", "humanized counter sent in thread"], ["sheet", "round logged · chaser armed for silence"]] },
    ],
  },

  orm: {
    file: "orm-lead-engine.json",
    nodes: [
      { id: "trig", x: 30, y: 197, ico: "⏲", lbl: "Schedule", sub: "cron trigger" },
      { id: "fetch", x: 260, y: 96, ico: "{}", lbl: "News Fetch", sub: "GDELT · 19 queries" },
      { id: "reddit", x: 260, y: 300, ico: "r/", lbl: "Reddit Monitor", sub: "thread watch" },
      { id: "scrape", x: 490, y: 197, ico: "</>", lbl: "Scrape + Clean", sub: ">350w · else Jina" },
      { id: "judge", x: 720, y: 197, ico: "AI", lbl: "Severity Judge", sub: "LLM · score 1–10" },
      { id: "entity", x: 950, y: 96, ico: "◎", lbl: "Entity Extract", sub: "who · which company" },
      { id: "drop", x: 950, y: 306, ico: "×", lbl: "Discard", sub: "not worth a pitch" },
      { id: "match", x: 1180, y: 96, ico: "in", lbl: "Identity Match", sub: "4-tier LinkedIn" },
    ],
    edges: [
      { a: "trig", b: "fetch" }, { a: "trig", b: "reddit" },
      { a: "fetch", b: "scrape" }, { a: "reddit", b: "scrape" },
      { a: "scrape", b: "judge" },
      { a: "judge", b: "entity", label: "≥ 5" },
      { a: "judge", b: "drop", label: "< 5", off: true },
      { a: "entity", b: "match" },
    ],
    steps: [
      { start: "trig", log: [["schedule", "trigger fired"]] },
      { go: ["trig>fetch", "trig>reddit"], log: [["gdelt", "19 news queries dispatched"], ["reddit", "new threads pulled"]] },
      { go: ["fetch>scrape", "reddit>scrape"], log: [["scrape", "batches of 25 · keep &gt;350 words, else Jina Reader"]] },
      { go: ["scrape>judge"], log: [["ai-judge", "severity + ability-to-pay scored per story"]] },
      { go: ["judge>entity", "judge>drop"], log: [["discard", "low-severity stories dropped before any paid lookup", "t-dim"], ["entity", "person + company extracted"]] },
      { go: ["entity>match"], log: [["identity", "4-tier LinkedIn search → AI verify → domain → prospect sheet"]] },
    ],
  },

  listening: {
    file: "icp-listener.json",
    nodes: [
      { id: "sched", x: 30, y: 197, ico: "⏲", lbl: "Schedule", sub: "every 2h" },
      { id: "search", x: 260, y: 197, ico: "⌕", lbl: "Post Search", sub: "Apify · 11 clusters" },
      { id: "filter", x: 490, y: 197, ico: "▽", lbl: "Noise Filter", sub: "drop company pages" },
      { id: "cls", x: 720, y: 197, ico: "AI", lbl: "Intent Classifier", sub: "relevance A–D" },
      { id: "enrich", x: 950, y: 197, ico: "+", lbl: "Enrich + Score", sub: "profile · company" },
      { id: "q", x: 1180, y: 60, ico: "✓", lbl: "Qualified", sub: "→ sales tab" },
      { id: "p", x: 1180, y: 197, ico: "~", lbl: "Partial", sub: "→ nurture tab" },
      { id: "d", x: 1180, y: 334, ico: "×", lbl: "Disqualified", sub: "→ audit tab" },
    ],
    edges: [
      { a: "sched", b: "search" }, { a: "search", b: "filter" }, { a: "filter", b: "cls" },
      { a: "cls", b: "enrich" },
      { a: "enrich", b: "q" }, { a: "enrich", b: "p" }, { a: "enrich", b: "d" },
    ],
    steps: [
      { start: "sched", log: [["schedule", "2-hour tick"]] },
      { go: ["sched>search"], log: [["apify", "11 keyword chains pulling fresh posts"]] },
      { go: ["search>filter"], log: [["filter", "company pages + noise dropped before any AI spend"]] },
      { go: ["filter>cls"], log: [["classifier", "posts graded A–D · D discarded"]] },
      { go: ["cls>enrich"], log: [["enrich", "author + company enriched · ICP fit scored"]] },
      { go: ["enrich>q", "enrich>p", "enrich>d"], log: [["switch", "routed to Qualified / Partial / Disqualified"]] },
    ],
  },

  "listening-saas": {
    file: "client-listening.json",
    nodes: [
      { id: "cfg", x: 30, y: 197, ico: "⚙", lbl: "Client Config", sub: "keywords + prompts" },
      { id: "search", x: 260, y: 197, ico: "⌕", lbl: "Post Search", sub: "shared key pool" },
      { id: "gate", x: 490, y: 197, ico: "AI", lbl: "Relevance Gate", sub: "per-client prompt" },
      { id: "writer", x: 720, y: 110, ico: "✎", lbl: "Comment Writer", sub: "LLM · client voice" },
      { id: "skip", x: 720, y: 300, ico: "×", lbl: "Skip", sub: "not relevant" },
      { id: "sheet", x: 950, y: 110, ico: "▤", lbl: "Client Sheet", sub: "draft + status" },
      { id: "review", x: 1180, y: 110, ico: "✓", lbl: "Client Review", sub: "approve → post" },
    ],
    edges: [
      { a: "cfg", b: "search" }, { a: "search", b: "gate" },
      { a: "gate", b: "writer", label: "RELEVANT" },
      { a: "gate", b: "skip", off: true },
      { a: "writer", b: "sheet" }, { a: "sheet", b: "review" },
    ],
    steps: [
      { start: "cfg", log: [["config", "client keywords + prompts loaded"]] },
      { go: ["cfg>search"], log: [["apify", "staggered slot · rotating key from the pool"]] },
      { go: ["search>gate"], log: [["gate", "each post judged against this client's ICP"]] },
      { go: ["gate>writer", "gate>skip"], log: [["writer", "comment drafted in the client's voice"]] },
      { go: ["writer>sheet"], log: [["sheet", "draft + post link + status written"]] },
      { go: ["sheet>review"], log: [["client", "reviews and posts · nothing goes out unapproved"]] },
    ],
  },

  whatsapp: {
    file: "whatsapp-agent.json",
    nodes: [
      { id: "hook", x: 30, y: 197, ico: "⚡", lbl: "WhatsApp Webhook", sub: "Evolution API" },
      { id: "norm", x: 260, y: 197, ico: "{}", lbl: "Normalize", sub: "instance → tenant" },
      { id: "gate", x: 490, y: 197, ico: "▽", lbl: "Bot Gate", sub: "drop auto-replies" },
      { id: "lead", x: 720, y: 197, ico: "◎", lbl: "Lead Lookup", sub: "Supabase · paused?" },
      { id: "agent", x: 950, y: 110, ico: "AI", lbl: "KB Agent", sub: "products · FAQs" },
      { id: "esc", x: 950, y: 300, ico: "!", lbl: "Escalate", sub: "Telegram · pause" },
      { id: "send", x: 1180, y: 110, ico: "→", lbl: "Reply + Log", sub: "sendText · history" },
    ],
    edges: [
      { a: "hook", b: "norm" }, { a: "norm", b: "gate" }, { a: "gate", b: "lead" },
      { a: "lead", b: "agent", label: "active" },
      { a: "lead", b: "esc", label: "handoff", off: true },
      { a: "agent", b: "send" },
    ],
    steps: [
      { start: "hook", log: [["webhook", "inbound WhatsApp message"]] },
      { go: ["hook>norm"], log: [["tenant", "instance id → business record"]] },
      { go: ["norm>gate"], log: [["gate", "human sender confirmed · bots ignored"]] },
      { go: ["gate>lead"], log: [["supabase", "lead found · not paused"]] },
      { go: ["lead>agent"], log: [["agent", "answer grounded in this business's KB"]] },
      { go: ["agent>send"], log: [["send", "reply sent · conversation logged"], ["handoff", "escalation branch idle", "t-dim"]] },
    ],
  },

  journalist: {
    file: "journalist-pipeline.json",
    nodes: [
      { id: "rss", x: 30, y: 110, ico: "⌕", lbl: "News RSS", sub: "Google News + Bing" },
      { id: "feeds", x: 30, y: 290, ico: "≋", lbl: "Publisher Feeds", sub: "103 bylined feeds" },
      { id: "byline", x: 260, y: 197, ico: "✍", lbl: "Byline Extract", sub: "structured data" },
      { id: "email", x: 490, y: 197, ico: "@", lbl: "Email Discovery", sub: "site first · lookup" },
      { id: "verify", x: 720, y: 197, ico: "✓", lbl: "Bounce Verify", sub: "valid only" },
      { id: "draft", x: 950, y: 197, ico: "AI", lbl: "Pitch Draft", sub: "Claude · on-beat" },
      { id: "queue", x: 1180, y: 197, ico: "▤", lbl: "Review Queue", sub: "human approves" },
    ],
    edges: [
      { a: "rss", b: "byline" }, { a: "feeds", b: "byline" },
      { a: "byline", b: "email" }, { a: "email", b: "verify" },
      { a: "verify", b: "draft" }, { a: "draft", b: "queue" },
    ],
    steps: [
      { start: "rss", log: [["discover", "this week's on-beat stories collected"]] },
      { go: ["rss>byline", "feeds>byline"], log: [["byline", "author pulled from article metadata"]] },
      { go: ["byline>email"], log: [["email", "published address first · paid lookup second"]] },
      { go: ["email>verify"], log: [["verify", "bounce-checked · risky addresses held back"]] },
      { go: ["verify>draft"], log: [["claude", "short pitch anchored on their latest piece · AI-text check"]] },
      { go: ["draft>queue"], log: [["queue", "row on HOLD until a human approves"]] },
    ],
  },

  "expert-answers": {
    file: "expert-autopilot.json",
    nodes: [
      { id: "feed", x: 30, y: 197, ico: "?", lbl: "Request Feed", sub: "journalist questions" },
      { id: "open", x: 260, y: 197, ico: "⏲", lbl: "Close-Date Filter", sub: "open requests only" },
      { id: "fit", x: 490, y: 197, ico: "◎", lbl: "Fit Check", sub: "profile + QID" },
      { id: "draft", x: 720, y: 197, ico: "✎", lbl: "Voice Draft", sub: "from real work" },
      { id: "gate", x: 950, y: 197, ico: "AI", lbl: "AI-Detector Gate", sub: "ZeroGPT score" },
      { id: "submit", x: 1180, y: 110, ico: "→", lbl: "Submit + Track", sub: "tracker row stamped" },
      { id: "rewrite", x: 1180, y: 300, ico: "↺", lbl: "Rewrite", sub: "score too high" },
    ],
    edges: [
      { a: "feed", b: "open" }, { a: "open", b: "fit" }, { a: "fit", b: "draft" }, { a: "draft", b: "gate" },
      { a: "gate", b: "submit", label: "pass" },
      { a: "gate", b: "rewrite", label: "fail", off: true },
    ],
    steps: [
      { start: "feed", log: [["feed", "new journalist requests pulled"]] },
      { go: ["feed>open"], log: [["filter", "expired requests dropped first"]] },
      { go: ["open>fit"], log: [["match", "matched on profile AND question id"]] },
      { go: ["fit>draft"], log: [["draft", "answer written in the expert's voice"]] },
      { go: ["draft>gate"], log: [["zerogpt", "AI-likelihood checked before anything is sent"]] },
      { go: ["gate>submit"], log: [["submit", "answer submitted · tracker updated"]] },
    ],
  },

  "email-stack": {
    file: "outbound-stack.json",
    nodes: [
      { id: "icp", x: 30, y: 197, ico: "◎", lbl: "ICP Leads", sub: "qualified sheet" },
      { id: "enrich", x: 260, y: 197, ico: "+", lbl: "Enrich", sub: "email finders" },
      { id: "verify", x: 490, y: 197, ico: "✓", lbl: "Verify", sub: "bounce check" },
      { id: "push", x: 720, y: 197, ico: "→", lbl: "Campaign Push", sub: "Reachinbox" },
      { id: "warm", x: 950, y: 300, ico: "♨", lbl: "Warmup Gateway", sub: "15 Gmail accounts" },
      { id: "track", x: 950, y: 100, ico: "↻", lbl: "Reply Tracker", sub: "status updates" },
      { id: "report", x: 1180, y: 100, ico: "▤", lbl: "Reports", sub: "day · week · month" },
    ],
    edges: [
      { a: "icp", b: "enrich" }, { a: "enrich", b: "verify" }, { a: "verify", b: "push" },
      { a: "push", b: "track", label: "replies" },
      { a: "push", b: "warm", label: "inbox health" },
      { a: "track", b: "report" },
    ],
    steps: [
      { start: "icp", log: [["sheet", "qualified leads picked up"]] },
      { go: ["icp>enrich"], log: [["enrich", "work emails found"]] },
      { go: ["enrich>verify"], log: [["verify", "invalid + risky addresses removed"]] },
      { go: ["verify>push"], log: [["reachinbox", "leads pushed into the right campaign"]] },
      { go: ["push>track", "push>warm"], log: [["tracker", "reply category synced · interested → not interested updates in place"], ["warmup", "inboxes kept warm through one Gmail API gateway"]] },
      { go: ["track>report"], log: [["report", "funnel + cost rolled up · ~$0.029 per lead"]] },
    ],
  },

  gateway: {
    file: "ai-gateway.json",
    nodes: [
      { id: "n8n", x: 30, y: 197, ico: "n8", lbl: "n8n AI Node", sub: "OpenAI-style call" },
      { id: "gw", x: 260, y: 197, ico: "⇄", lbl: "Gateway /v1", sub: "Docker · internal" },
      { id: "p1", x: 490, y: 90, ico: "1", lbl: "NVIDIA", sub: "timeout → next" },
      { id: "p2", x: 720, y: 90, ico: "2", lbl: "Groq", sub: "fast fallback" },
      { id: "p3", x: 950, y: 90, ico: "3", lbl: "OpenRouter", sub: "fallback" },
      { id: "p4", x: 1180, y: 90, ico: "4", lbl: "Gemini", sub: "last resort" },
      { id: "res", x: 950, y: 300, ico: "✓", lbl: "Response", sub: "back to the workflow" },
    ],
    edges: [
      { a: "n8n", b: "gw" }, { a: "gw", b: "p1" },
      { a: "p1", b: "p2" },
      { a: "p2", b: "res", label: "200" },
      { a: "p2", b: "p3", off: true },
      { a: "p3", b: "p4", off: true },
    ],
    steps: [
      { start: "n8n", log: [["n8n", "chat completion requested"]] },
      { go: ["n8n>gw"], log: [["gateway", "routed inside the Docker network · no public port"]] },
      { go: ["gw>p1"], log: [["nvidia", "no answer in time", "t-acc"]] },
      { go: ["p1>p2"], log: [["failover", "next provider · next key"]] },
      { go: ["p2>res"], log: [["groq", "answered · workflow never noticed the failure"]] },
    ],
  },

  ops: {
    file: "company-ops.json",
    nodes: [
      { id: "form", x: 30, y: 90, ico: "▢", lbl: "Tally Forms", sub: "expense + invoice" },
      { id: "hook", x: 260, y: 90, ico: "⚡", lbl: "Webhook", sub: "request ID issued" },
      { id: "ledger", x: 490, y: 90, ico: "▤", lbl: "Sheet Ledger", sub: "+ email receipt" },
      { id: "digest", x: 720, y: 90, ico: "⏲", lbl: "HR Digest", sub: "9:30 IST · Chat" },
      { id: "remind", x: 950, y: 90, ico: "!", lbl: "Team Reminder", sub: "10:00 IST" },
      { id: "tg", x: 30, y: 300, ico: "/", lbl: "Telegram /price", sub: "sales team asks" },
      { id: "fuzzy", x: 260, y: 300, ico: "≈", lbl: "Fuzzy Match", sub: "publication names" },
      { id: "reply", x: 490, y: 300, ico: "→", lbl: "Price Reply", sub: "inline buttons" },
    ],
    edges: [
      { a: "form", b: "hook" }, { a: "hook", b: "ledger" }, { a: "ledger", b: "digest" }, { a: "digest", b: "remind" },
      { a: "tg", b: "fuzzy" }, { a: "fuzzy", b: "reply" },
    ],
    steps: [
      { start: ["form", "tg"], log: [["tally", "expense request submitted"], ["telegram", "/price asked by sales"]] },
      { go: ["form>hook", "tg>fuzzy"], log: [["webhook", "request ID created"], ["bot", "/price query parsed"]] },
      { go: ["hook>ledger", "fuzzy>reply"], log: [["ledger", "row written · ID emailed back"], ["bot", "closest publication matched · price sent"]] },
      { go: ["ledger>digest"], log: [["digest", "pending invoices sent to HR"]] },
      { go: ["digest>remind"], log: [["chat", "team reminded to upload missing invoices"]] },
    ],
  },
};
