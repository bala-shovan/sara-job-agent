// Roles anyone can pick when hiring Sara. Each role is matched against job
// titles by its keywords; "cues" are words in someone's experience that hint
// the role suits them, used to suggest roles. People can also add any role
// that isn't listed.

export const ROLE_CATALOG = [
  // Product and project
  { family: 'pm', label: 'Product Manager / AI PM', group: 'Product',
    keywords: ['product manager', 'product owner', 'ai product', 'technical product manager', 'product lead'],
    cues: ['product manager', 'product owner', 'roadmap', 'prd', 'backlog', 'user stories', 'cspo', 'product discovery'] },
  { family: 'project_manager', label: 'Project / Program Manager', group: 'Product',
    keywords: ['project manager', 'program manager', 'delivery manager'],
    cues: ['project manager', 'program manager', 'pmp', 'prince2', 'project delivery', 'timelines'] },
  { family: 'scrum_master', label: 'Scrum Master / Agile Coach', group: 'Product',
    keywords: ['scrum master', 'agile coach'], cues: ['scrum master', 'sprint planning', 'retrospectives', 'agile coach', 'csm certified'] },
  { family: 'business_analyst', label: 'Business Analyst', group: 'Product',
    keywords: ['business analyst', 'systems analyst'], cues: ['business analyst', 'requirements gathering', 'process mapping', 'brd'] },

  // Support and customer success
  { family: 'support_engineer', label: 'Product Support Engineer', group: 'Support and success',
    keywords: ['product support engineer', 'technical support engineer', 'support engineer', 'application support'],
    cues: ['support engineer', 'technical support', 'escalations', 'kibana', 'postman', 'troubleshooting', 'jira'] },
  { family: 'support_lead', label: 'Support Lead / Manager', group: 'Support and success',
    keywords: ['support lead', 'support team lead', 'support manager', 'technical support manager'],
    cues: ['support manager', 'support lead', 'led a team', 'team of', 'escalation process'] },
  { family: 'customer_support', label: 'Customer Support Specialist', group: 'Support and success',
    keywords: ['customer support', 'customer service', 'support specialist', 'support agent', 'support representative', 'help desk', 'helpdesk'],
    cues: ['customer support', 'customer service', 'zendesk', 'freshdesk', 'intercom', 'tickets', 'csat'] },
  { family: 'csm', label: 'Customer Success Manager', group: 'Support and success',
    keywords: ['customer success manager', 'customer success'],
    cues: ['customer success', 'renewals', 'churn', 'qbr', 'onboarding customers', 'account health'] },
  { family: 'account_manager', label: 'Account Manager', group: 'Support and success',
    keywords: ['account manager', 'key account'], cues: ['account manager', 'key accounts', 'upsell', 'client relationships'] },
  { family: 'implementation', label: 'Implementation / Onboarding Specialist', group: 'Support and success',
    keywords: ['implementation manager', 'implementation specialist', 'implementation consultant', 'onboarding specialist', 'onboarding manager'],
    cues: ['implementation', 'onboarding', 'go-live', 'integrations', 'configuration'] },
  { family: 'solutions_engineer', label: 'Solutions / Sales Engineer', group: 'Support and success',
    keywords: ['solutions engineer', 'sales engineer', 'solutions architect', 'solutions consultant', 'pre-sales'],
    cues: ['solutions engineer', 'pre-sales', 'presales', 'demos', 'proof of concept', 'rfp'] },
  { family: 'technical_writer', label: 'Technical Writer', group: 'Support and success',
    keywords: ['technical writer', 'documentation specialist', 'documentation writer'],
    cues: ['technical writer', 'documentation', 'knowledge base', 'help center', 'release notes', 'api docs'] },

  // Engineering and data
  { family: 'software_engineer', label: 'Software Engineer', group: 'Engineering and data',
    keywords: ['software engineer', 'software developer', 'web developer', 'programmer'],
    cues: ['software engineer', 'developer', 'javascript', 'typescript', 'python', 'java', 'c#', 'golang', 'git'] },
  { family: 'frontend', label: 'Frontend Developer', group: 'Engineering and data',
    keywords: ['frontend', 'front-end', 'front end', 'react developer', 'ui engineer'],
    cues: ['react', 'vue', 'angular', 'css', 'html', 'next.js', 'frontend'] },
  { family: 'backend', label: 'Backend Developer', group: 'Engineering and data',
    keywords: ['backend', 'back-end', 'back end'],
    cues: ['node.js', 'django', 'spring', 'rest api', 'microservices', 'postgresql', 'backend'] },
  { family: 'fullstack', label: 'Full-stack Developer', group: 'Engineering and data',
    keywords: ['full stack', 'full-stack', 'fullstack'], cues: ['full stack', 'full-stack', 'mern', 'react and node'] },
  { family: 'mobile', label: 'Mobile Developer', group: 'Engineering and data',
    keywords: ['ios developer', 'ios engineer', 'android developer', 'android engineer', 'mobile developer', 'mobile engineer', 'flutter', 'react native'],
    cues: ['swift', 'kotlin', 'flutter', 'react native', 'ios', 'android'] },
  { family: 'devops', label: 'DevOps / Cloud Engineer', group: 'Engineering and data',
    keywords: ['devops', 'site reliability', 'sre', 'platform engineer', 'cloud engineer', 'infrastructure engineer'],
    cues: ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform', 'ci/cd', 'devops'] },
  { family: 'qa', label: 'QA / Test Engineer', group: 'Engineering and data',
    keywords: ['qa engineer', 'qa analyst', 'quality assurance', 'test engineer', 'sdet', 'software tester', 'automation tester'],
    cues: ['qa', 'testing', 'selenium', 'cypress', 'test cases', 'regression testing'] },
  { family: 'eng_manager', label: 'Engineering Manager / Tech Lead', group: 'Engineering and data',
    keywords: ['engineering manager', 'tech lead', 'technical lead', 'head of engineering'],
    cues: ['engineering manager', 'tech lead', 'led engineers', 'architecture decisions'] },
  { family: 'data_analyst', label: 'Data / BI Analyst', group: 'Engineering and data',
    keywords: ['data analyst', 'bi analyst', 'business intelligence', 'analytics analyst', 'reporting analyst'],
    cues: ['sql', 'tableau', 'power bi', 'looker', 'dashboards', 'excel', 'data analysis'] },
  { family: 'data_engineer', label: 'Data Engineer', group: 'Engineering and data',
    keywords: ['data engineer', 'etl developer', 'analytics engineer'], cues: ['etl', 'airflow', 'spark', 'dbt', 'snowflake', 'bigquery', 'data pipelines'] },
  { family: 'data_scientist', label: 'Data Scientist / ML Engineer', group: 'Engineering and data',
    keywords: ['data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'applied scientist'],
    cues: ['machine learning', 'pytorch', 'tensorflow', 'scikit-learn', 'nlp', 'llm', 'models'] },
  { family: 'security', label: 'Security Engineer / Analyst', group: 'Engineering and data',
    keywords: ['security engineer', 'security analyst', 'cybersecurity', 'information security', 'soc analyst'],
    cues: ['security', 'penetration testing', 'siem', 'iso 27001', 'vulnerability'] },

  // Design
  { family: 'product_designer', label: 'Product / UX Designer', group: 'Design',
    keywords: ['product designer', 'ux designer', 'ui designer', 'ux/ui', 'ui/ux', 'interaction designer'],
    cues: ['figma', 'wireframes', 'prototypes', 'user research', 'design system', 'ux'] },
  { family: 'graphic_designer', label: 'Graphic / Brand Designer', group: 'Design',
    keywords: ['graphic designer', 'visual designer', 'brand designer', 'motion designer'],
    cues: ['photoshop', 'illustrator', 'branding', 'after effects', 'graphic design'] },
  { family: 'ux_researcher', label: 'UX Researcher', group: 'Design',
    keywords: ['ux researcher', 'user researcher', 'design researcher'], cues: ['usability testing', 'user interviews', 'ux research'] },

  // Marketing and sales
  { family: 'marketing_manager', label: 'Marketing / Product Marketing Manager', group: 'Marketing and sales',
    keywords: ['marketing manager', 'product marketing', 'growth marketing', 'marketing lead', 'brand manager'],
    cues: ['marketing', 'go-to-market', 'campaigns', 'positioning', 'gtm'] },
  { family: 'content', label: 'Content Writer / Strategist', group: 'Marketing and sales',
    keywords: ['content writer', 'content marketer', 'content marketing', 'copywriter', 'content strategist', 'content manager', 'content editor'],
    cues: ['content', 'blog', 'copywriting', 'editorial', 'articles'] },
  { family: 'seo', label: 'SEO Specialist', group: 'Marketing and sales',
    keywords: ['seo specialist', 'seo manager', 'seo analyst', 'seo'], cues: ['seo', 'keyword research', 'google search console', 'ahrefs', 'semrush'] },
  { family: 'digital_marketing', label: 'Digital / Performance Marketer', group: 'Marketing and sales',
    keywords: ['digital marketing', 'performance marketing', 'paid media', 'ppc', 'paid social', 'media buyer'],
    cues: ['google ads', 'facebook ads', 'meta ads', 'ppc', 'roas', 'paid campaigns'] },
  { family: 'social_media', label: 'Social Media / Community Manager', group: 'Marketing and sales',
    keywords: ['social media', 'community manager'], cues: ['social media', 'instagram', 'tiktok', 'community'] },
  { family: 'sales', label: 'Sales / Business Development', group: 'Marketing and sales',
    keywords: ['sales representative', 'sales executive', 'account executive', 'business development', 'bdr', 'sdr', 'sales manager'],
    cues: ['sales', 'quota', 'pipeline', 'crm', 'salesforce', 'hubspot', 'cold outreach', 'lead generation'] },

  // Operations, people and finance
  { family: 'operations', label: 'Operations Manager / Analyst', group: 'Operations, people and finance',
    keywords: ['operations manager', 'operations specialist', 'operations analyst', 'operations lead', 'business operations'],
    cues: ['operations', 'process improvement', 'logistics', 'supply chain', 'sops'] },
  { family: 'recruiter', label: 'Recruiter / Talent Acquisition', group: 'Operations, people and finance',
    keywords: ['recruiter', 'talent acquisition', 'sourcer', 'technical recruiter'], cues: ['recruiting', 'hiring', 'sourcing', 'talent acquisition'] },
  { family: 'hr', label: 'HR / People Operations', group: 'Operations, people and finance',
    keywords: ['hr manager', 'hr generalist', 'hr business partner', 'people operations', 'human resources'],
    cues: ['human resources', 'payroll', 'employee relations', 'people operations', 'hr'] },
  { family: 'finance', label: 'Finance / Accounting', group: 'Operations, people and finance',
    keywords: ['accountant', 'financial analyst', 'finance manager', 'bookkeeper', 'controller', 'fp&a'],
    cues: ['accounting', 'financial statements', 'quickbooks', 'xero', 'fp&a', 'budgeting', 'acca', 'cpa'] },
  { family: 'admin', label: 'Executive / Virtual Assistant', group: 'Operations, people and finance',
    keywords: ['executive assistant', 'virtual assistant', 'administrative assistant', 'office manager'],
    cues: ['calendar management', 'scheduling', 'executive assistant', 'virtual assistant'] },
];

const byFamily = new Map(ROLE_CATALOG.map((r) => [r.family, r]));
export const catalogRole = (family) => byFamily.get(family) || null;

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const count = (text, phrase) => (text.match(new RegExp(`(^|[^a-z0-9])${escape(phrase)}(?=$|[^a-z0-9])`, 'g')) || []).length;

// Roles that look like a fit for someone's experience, best first
export function suggestRoles(experience = '', exclude = [], limit = 6) {
  const text = experience.toLowerCase();
  if (text.trim().length < 40) return [];
  const skip = new Set(exclude);
  return ROLE_CATALOG
    .filter((r) => !skip.has(r.family))
    .map((r) => ({
      role: r,
      score: r.keywords.reduce((n, k) => n + 3 * Math.min(count(text, k), 3), 0)
        + r.cues.reduce((n, c) => n + Math.min(count(text, c), 3), 0),
    }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.role);
}

// Search the catalog by label or title phrase
export function searchRoles(query = '', exclude = [], limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const skip = new Set(exclude);
  return ROLE_CATALOG
    .filter((r) => !skip.has(r.family))
    .filter((r) => r.label.toLowerCase().includes(q) || r.keywords.some((k) => k.includes(q) || q.includes(k)))
    .slice(0, limit);
}

// A role someone typed that isn't in the list
export function customRole(title) {
  const clean = title.trim().replace(/\s+/g, ' ');
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  return {
    family: `custom_${slug}`,
    label: clean.replace(/\b\w/g, (c) => c.toUpperCase()),
    keywords: [clean.toLowerCase()],
  };
}
