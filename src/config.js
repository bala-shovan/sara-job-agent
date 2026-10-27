// Central settings. Everything secret comes from environment variables
// (GitHub Secrets in production, a local .env file while developing).

const env = process.env;

export const config = {
  mock: env.SARA_MOCK === '1',

  supabaseUrl: env.SUPABASE_URL,
  supabaseServiceKey: env.SUPABASE_SERVICE_KEY,

  // AI: Gemini first, Groq as fallback. Change the model without touching code.
  geminiApiKey: env.GEMINI_API_KEY,
  geminiModel: env.GEMINI_MODEL || 'gemini-3.8-flash',
  groqApiKey: env.GROQ_API_KEY,
  groqModel: env.GROQ_MODEL || 'openai/gpt-oss-120b',

  gmailUser: env.GMAIL_USER,
  gmailAppPassword: env.GMAIL_APP_PASSWORD,
  emailTo: env.EMAIL_TO || env.GMAIL_USER,
  dashboardUrl: env.DASHBOARD_URL || '',

  // Limits that keep Sara inside free tiers
  maxJobsToScore: Number(env.MAX_JOBS_TO_SCORE || 40),
  scoringBatchSize: Number(env.SCORING_BATCH_SIZE || 10),
  maxJobAgeDays: Number(env.MAX_JOB_AGE_DAYS || 30),
  descriptionCharsForAi: 1500,
};

// Used when the profile table can't be read (mock mode, or a first run).
// Mirrors the row inserted by supabase/schema.sql.
export const defaultProfile = {
  role_families: [
    { priority: 1, family: 'pm', label: 'Product Manager / AI PM', bonus: 15,
      title_keywords: ['product manager', 'product owner', 'ai product', 'technical product manager', 'product lead'] },
    { priority: 2, family: 'support_engineer', label: 'Product Support Engineer', bonus: 10,
      title_keywords: ['product support engineer', 'technical support engineer', 'support engineer', 'application support'] },
    { priority: 3, family: 'support_lead', label: 'Support Lead', bonus: 5,
      title_keywords: ['support lead', 'support team lead', 'support manager', 'technical support manager'] },
    { priority: 4, family: 'csm', label: 'Customer Success Manager', bonus: 0,
      title_keywords: ['customer success manager'] },
  ],
  locations: {
    remote_allowed: ['worldwide', 'anywhere', 'global', 'apac', 'asia', 'bangladesh'],
    onsite_cities: ['dhaka'],
    us_hours_ok: true,
  },
  exclusions: {
    drop_us_only_remote: true,
    drop_title_words: ['intern', 'internship', 'junior', 'entry level', 'director', 'vp', 'vice president', 'head of'],
  },
  seniority: ['mid', 'senior', 'lead'],
  min_monthly_usd: 2000,
  picks_per_day: 5,
  min_final_score: 60,
  run_time: '09:00 Asia/Dhaka',
  // Set from the dashboard (supabase/002_hire_sara.sql)
  candidate_profile: null, // null = fall back to candidate-profile.md
  active: true,
  hired_at: '2026-10-27T00:00:00Z',
  run_hour: 9,
  run_days: [1, 2, 3, 4, 5, 6, 7],
  timezone: 'Asia/Dhaka',
  email_to: null,
};
