/**
 * BAM OS — Revenue Systems Seeder
 * 42 dedicated business systems (7 per category)
 * Each system = full frontend + backend support
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface SystemDef {
  name: string
  tagline: string
  description: string
  category: 'leadgen' | 'booking' | 'sales' | 'digital' | 'brand' | 'local'
  revenue_potential: string
  setup_time: string
  conversion_focus: string
  use_case: string
  backend_features: string[]
  funnel_steps: string[]
  integrations: string[]
  api_endpoints: string[]
  benefits: string[]
}

const SYSTEMS: SystemDef[] = [
  // ─── LEAD GEN (7) ──────────────────────────────────────────
  {
    name: 'Agency Lead Machine',
    tagline: 'Turn visitors into qualified agency clients',
    description: 'Full lead generation system for digital agencies with portfolio showcase, case studies, qualification form, and automated follow-up pipeline.',
    category: 'leadgen', revenue_potential: '$5k–$40k/mo', setup_time: '12 min', conversion_focus: 'Qualified lead capture', use_case: 'Agency client acquisition',
    backend_features: ['Lead capture forms', 'Auto-qualification scoring', 'Email follow-up sequence', 'CRM pipeline integration', 'Analytics dashboard'],
    funnel_steps: ['Landing Page', 'Case Studies', 'Lead Magnet', 'Qualification Form', 'Thank You + Calendar'],
    integrations: ['Email (SMTP)', 'Calendar booking', 'CRM webhook', 'Analytics'],
    api_endpoints: ['/api/leads/capture', '/api/leads/qualify', '/api/email/sequence'],
    benefits: ['Captures leads 24/7', 'Auto-qualifies prospects', 'Books discovery calls', 'Nurtures with email sequences', 'Tracks conversion metrics'],
  },
  {
    name: 'Real Estate Listings Pro',
    tagline: 'Generate buyer and seller leads on autopilot',
    description: 'Property listing lead system with search filters, property detail pages, mortgage calculator, and lead capture for buyer/seller inquiries.',
    category: 'leadgen', revenue_potential: '$8k–$30k/mo', setup_time: '15 min', conversion_focus: 'Property inquiry capture', use_case: 'Real estate lead gen',
    backend_features: ['Property listing display', 'Search and filter system', 'Mortgage calculator widget', 'Lead capture with property interest', 'Agent assignment routing'],
    funnel_steps: ['Home Search Page', 'Property Detail', 'Schedule Viewing Form', 'Pre-Qualification', 'Agent Callback'],
    integrations: ['MLS data feed', 'Email notifications', 'SMS alerts', 'Calendar booking'],
    api_endpoints: ['/api/listings/search', '/api/leads/property-inquiry', '/api/calculator/mortgage'],
    benefits: ['Showcases listings beautifully', 'Captures buyer intent data', 'Pre-qualifies leads', 'Routes to right agent', 'Tracks listing performance'],
  },
  {
    name: 'SaaS Trial Converter',
    tagline: 'Convert traffic into trial signups and demos',
    description: 'High-converting SaaS landing system with product demo video, feature comparisons, social proof wall, and multi-step trial signup flow.',
    category: 'leadgen', revenue_potential: '$10k–$50k/mo', setup_time: '10 min', conversion_focus: 'Trial signups + demo requests', use_case: 'SaaS user acquisition',
    backend_features: ['Multi-step signup form', 'Demo request routing', 'Email drip onboarding', 'Usage tracking setup', 'A/B test support'],
    funnel_steps: ['Landing Page', 'Feature Tour', 'Social Proof', 'Signup Flow', 'Onboarding Email'],
    integrations: ['Stripe (trial)', 'Email sequences', 'Analytics', 'Slack notifications'],
    api_endpoints: ['/api/signup/trial', '/api/demo/request', '/api/onboarding/email'],
    benefits: ['Maximizes trial signups', 'Automates onboarding', 'Tracks activation metrics', 'Nurtures trial-to-paid', 'Reduces churn from day 1'],
  },
  {
    name: 'B2B Consultation Engine',
    tagline: 'Fill your calendar with qualified B2B meetings',
    description: 'Professional consultation booking system for B2B services with ROI calculator, industry case studies, and automated scheduling pipeline.',
    category: 'leadgen', revenue_potential: '$10k–$60k/mo', setup_time: '12 min', conversion_focus: 'Consultation bookings', use_case: 'B2B consulting',
    backend_features: ['ROI calculator widget', 'Industry-specific case studies', 'Multi-step qualification form', 'Calendar integration', 'Proposal auto-generation'],
    funnel_steps: ['Landing Page', 'ROI Calculator', 'Case Studies', 'Book Consultation', 'Pre-Meeting Questionnaire'],
    integrations: ['Calendar (Cal.com)', 'Email CRM', 'Proposal generator', 'Analytics'],
    api_endpoints: ['/api/calculator/roi', '/api/booking/consultation', '/api/proposal/generate'],
    benefits: ['Pre-qualifies B2B leads', 'Shows ROI before call', 'Auto-books consultations', 'Sends pre-meeting prep', 'Generates proposals'],
  },
  {
    name: 'Insurance Quote System',
    tagline: 'Capture and convert insurance leads at scale',
    description: 'Insurance lead generation with multi-step quote wizard, coverage comparison, instant estimate engine, and agent matching.',
    category: 'leadgen', revenue_potential: '$5k–$25k/mo', setup_time: '15 min', conversion_focus: 'Quote requests', use_case: 'Insurance sales',
    backend_features: ['Multi-step quote wizard', 'Coverage comparison tool', 'Instant estimate engine', 'Agent matching algorithm', 'Follow-up automation'],
    funnel_steps: ['Landing Page', 'Quote Wizard', 'Coverage Comparison', 'Agent Match', 'Follow-Up Sequence'],
    integrations: ['Email automation', 'SMS notifications', 'CRM pipeline', 'Quote calculator'],
    api_endpoints: ['/api/quote/calculate', '/api/agent/match', '/api/follow-up/trigger'],
    benefits: ['Captures quote requests', 'Provides instant estimates', 'Matches best agent', 'Automates follow-up', 'Tracks conversion rates'],
  },
  {
    name: 'Law Firm Intake System',
    tagline: 'Turn website visitors into retained clients',
    description: 'Legal client intake system with practice area pages, case evaluation form, conflict check, retainer agreement flow, and secure document upload.',
    category: 'leadgen', revenue_potential: '$10k–$50k/mo', setup_time: '12 min', conversion_focus: 'Case evaluations', use_case: 'Legal client acquisition',
    backend_features: ['Practice area landing pages', 'Case evaluation questionnaire', 'Conflict check system', 'Retainer agreement flow', 'Secure document upload'],
    funnel_steps: ['Practice Area Page', 'Case Evaluation', 'Conflict Check', 'Consultation Booking', 'Retainer Signing'],
    integrations: ['Calendar booking', 'Document signing', 'Secure upload', 'Email notifications'],
    api_endpoints: ['/api/intake/evaluate', '/api/conflict/check', '/api/retainer/send'],
    benefits: ['Qualifies cases before call', 'Checks conflicts automatically', 'Books consultations', 'Sends retainer digitally', 'Tracks intake pipeline'],
  },
  {
    name: 'Contractor Estimate Engine',
    tagline: 'Generate home service leads with instant quotes',
    description: 'Home services lead system with project scope wizard, instant estimate calculator, before/after gallery, and appointment booking.',
    category: 'leadgen', revenue_potential: '$5k–$25k/mo', setup_time: '10 min', conversion_focus: 'Estimate requests', use_case: 'Home services',
    backend_features: ['Project scope wizard', 'Instant estimate calculator', 'Before/after gallery', 'Appointment booking', 'Review collection'],
    funnel_steps: ['Service Page', 'Scope Wizard', 'Instant Estimate', 'Book Appointment', 'Follow-Up'],
    integrations: ['Calendar booking', 'SMS alerts', 'Review platforms', 'Email automation'],
    api_endpoints: ['/api/estimate/calculate', '/api/booking/appointment', '/api/reviews/request'],
    benefits: ['Provides instant estimates', 'Showcases past work', 'Books appointments', 'Collects reviews', 'Follows up automatically'],
  },

  // ─── BOOKING SYSTEMS (7) ───────────────────────────────────
  {
    name: 'Salon & Spa Booking Hub',
    tagline: 'Fill every appointment slot automatically',
    description: 'Complete salon booking system with service menu, stylist profiles, real-time availability calendar, package deals, and automated reminders.',
    category: 'booking', revenue_potential: '$5k–$20k/mo', setup_time: '10 min', conversion_focus: 'Appointment bookings', use_case: 'Beauty & wellness booking',
    backend_features: ['Service menu with pricing', 'Staff profiles and specialties', 'Real-time availability calendar', 'Package deal builder', 'Automated SMS/email reminders'],
    funnel_steps: ['Services Page', 'Select Stylist', 'Pick Date/Time', 'Confirm & Pay', 'Reminder Sequence'],
    integrations: ['Calendar sync', 'Stripe payments', 'SMS reminders', 'Review collection'],
    api_endpoints: ['/api/services/list', '/api/availability/check', '/api/booking/create', '/api/reminder/send'],
    benefits: ['Books appointments 24/7', 'Reduces no-shows by 80%', 'Upsells packages', 'Builds repeat clients', 'Collects reviews automatically'],
  },
  {
    name: 'Medical Practice Scheduler',
    tagline: 'Streamline patient scheduling and intake',
    description: 'Healthcare scheduling system with provider selection, insurance verification, patient intake forms, telehealth option, and HIPAA-compliant flow.',
    category: 'booking', revenue_potential: '$10k–$40k/mo', setup_time: '15 min', conversion_focus: 'Patient appointments', use_case: 'Healthcare booking',
    backend_features: ['Provider directory', 'Insurance verification widget', 'Digital intake forms', 'Telehealth booking option', 'Automated appointment reminders'],
    funnel_steps: ['Find Provider', 'Check Insurance', 'Select Appointment', 'Complete Intake', 'Confirmation + Reminders'],
    integrations: ['EHR system', 'Insurance APIs', 'Video conferencing', 'SMS/email reminders'],
    api_endpoints: ['/api/providers/search', '/api/insurance/verify', '/api/intake/submit', '/api/appointment/book'],
    benefits: ['Fills schedule efficiently', 'Verifies insurance upfront', 'Reduces paperwork', 'Supports telehealth', 'Decreases no-shows'],
  },
  {
    name: 'Fitness Class Booker',
    tagline: 'Maximize class attendance and membership sales',
    description: 'Gym and studio booking system with class schedule, trainer profiles, membership tiers, trial class booking, and attendance tracking.',
    category: 'booking', revenue_potential: '$3k–$15k/mo', setup_time: '10 min', conversion_focus: 'Class bookings + memberships', use_case: 'Fitness studio',
    backend_features: ['Weekly class schedule grid', 'Trainer profiles and bios', 'Membership tier selector', 'Trial class booking', 'Attendance tracking'],
    funnel_steps: ['Class Schedule', 'Select Class', 'Choose Membership', 'Book & Pay', 'Welcome Email'],
    integrations: ['Stripe subscriptions', 'Calendar sync', 'Email automation', 'Check-in system'],
    api_endpoints: ['/api/classes/schedule', '/api/membership/subscribe', '/api/booking/class', '/api/attendance/check-in'],
    benefits: ['Fills classes consistently', 'Sells memberships online', 'Converts trial to paid', 'Tracks attendance data', 'Reduces admin work'],
  },
  {
    name: 'Restaurant Reservation Engine',
    tagline: 'Turn walk-bys into reservations and orders',
    description: 'Restaurant system with interactive menu, table reservation, online ordering, waitlist management, and loyalty program.',
    category: 'booking', revenue_potential: '$5k–$25k/mo', setup_time: '10 min', conversion_focus: 'Reservations + online orders', use_case: 'Restaurant operations',
    backend_features: ['Interactive menu with photos', 'Table reservation system', 'Online ordering with cart', 'Waitlist management', 'Loyalty points program'],
    funnel_steps: ['Menu Browse', 'Reserve Table / Order Online', 'Customize Order', 'Checkout', 'Loyalty Enrollment'],
    integrations: ['Stripe payments', 'Kitchen display system', 'SMS notifications', 'Loyalty tracking'],
    api_endpoints: ['/api/menu/items', '/api/reservation/create', '/api/order/submit', '/api/loyalty/enroll'],
    benefits: ['Fills tables every night', 'Increases online orders', 'Manages waitlist automatically', 'Builds customer loyalty', 'Tracks revenue per table'],
  },
  {
    name: 'Consultant Calendar System',
    tagline: 'Sell your time at premium rates',
    description: 'Professional consulting booking with tiered session types, timezone-aware scheduling, pre-session questionnaire, payment upfront, and session notes.',
    category: 'booking', revenue_potential: '$5k–$30k/mo', setup_time: '8 min', conversion_focus: 'Paid consultations', use_case: 'Professional services',
    backend_features: ['Tiered session types (30/60/90 min)', 'Timezone-aware scheduling', 'Pre-session questionnaire', 'Upfront payment collection', 'Post-session notes and follow-up'],
    funnel_steps: ['Services & Pricing', 'Select Session Type', 'Pick Time Slot', 'Pay & Confirm', 'Pre-Session Prep'],
    integrations: ['Stripe payments', 'Google Calendar', 'Zoom/Meet links', 'Email automation'],
    api_endpoints: ['/api/sessions/types', '/api/availability/slots', '/api/booking/paid', '/api/session/prep'],
    benefits: ['Sells time slots 24/7', 'Collects payment upfront', 'Eliminates timezone confusion', 'Prepares clients before calls', 'Automates follow-up'],
  },
  {
    name: 'Pet Services Scheduler',
    tagline: 'Book grooming, boarding, and training online',
    description: 'Pet services booking with service selection, pet profile registration, recurring appointment setup, vaccination tracking, and groomer assignment.',
    category: 'booking', revenue_potential: '$3k–$15k/mo', setup_time: '10 min', conversion_focus: 'Service bookings', use_case: 'Pet care business',
    backend_features: ['Service menu (groom/board/train)', 'Pet profile registration', 'Recurring appointment setup', 'Vaccination record tracking', 'Staff assignment'],
    funnel_steps: ['Services Page', 'Register Pet', 'Select Service', 'Pick Schedule', 'Confirm & Pay'],
    integrations: ['Calendar booking', 'Stripe payments', 'SMS reminders', 'Pet record storage'],
    api_endpoints: ['/api/pets/register', '/api/services/book', '/api/recurring/setup', '/api/records/vaccination'],
    benefits: ['Books services online', 'Manages pet records', 'Sets up recurring visits', 'Reduces no-shows', 'Tracks pet history'],
  },
  {
    name: 'Event Venue Booking',
    tagline: 'Rent your venue out with zero back-and-forth',
    description: 'Venue rental system with virtual tour, capacity calculator, date availability checker, add-on services selector, and contract/deposit flow.',
    category: 'booking', revenue_potential: '$5k–$30k/mo', setup_time: '12 min', conversion_focus: 'Venue bookings', use_case: 'Event venue rental',
    backend_features: ['Virtual venue tour', 'Capacity calculator', 'Date availability checker', 'Add-on services selector', 'Contract and deposit flow'],
    funnel_steps: ['Venue Gallery', 'Check Availability', 'Select Add-Ons', 'Review Pricing', 'Sign & Deposit'],
    integrations: ['Calendar blocking', 'Stripe deposits', 'Document signing', 'Email confirmations'],
    api_endpoints: ['/api/venue/availability', '/api/pricing/calculate', '/api/contract/send', '/api/deposit/collect'],
    benefits: ['Shows venue beautifully', 'Checks availability instantly', 'Calculates pricing automatically', 'Collects deposits online', 'Sends contracts digitally'],
  },

  // ─── SALES FUNNELS (7) ─────────────────────────────────────
  {
    name: 'Product Launch Funnel',
    tagline: 'Launch products with maximum revenue impact',
    description: 'Complete product launch system with countdown timer, early-bird pricing, testimonial wall, scarcity triggers, checkout with order bump, and upsell flow.',
    category: 'sales', revenue_potential: '$10k–$100k/launch', setup_time: '15 min', conversion_focus: 'Product sales', use_case: 'Product launches',
    backend_features: ['Countdown timer system', 'Early-bird pricing engine', 'Testimonial management', 'Scarcity and urgency triggers', 'Order bump at checkout', 'One-click upsell page'],
    funnel_steps: ['Pre-Launch Waitlist', 'Launch Page', 'Product Demo', 'Checkout + Order Bump', 'Upsell', 'Thank You + Onboarding'],
    integrations: ['Stripe checkout', 'Email sequences', 'Countdown timer', 'Analytics'],
    api_endpoints: ['/api/waitlist/join', '/api/checkout/create', '/api/upsell/offer', '/api/onboarding/start'],
    benefits: ['Creates launch buzz', 'Drives urgency with countdown', 'Maximizes AOV with bumps', 'Upsells after purchase', 'Automates delivery'],
  },
  {
    name: 'High-Ticket Sales System',
    tagline: 'Close $5k–$25k deals through your website',
    description: 'High-ticket sales funnel with VSL page, application form, qualification scoring, calendar booking, and proposal automation.',
    category: 'sales', revenue_potential: '$20k–$100k/mo', setup_time: '12 min', conversion_focus: 'Application submissions', use_case: 'High-ticket services',
    backend_features: ['Video sales letter page', 'Application form with scoring', 'Auto-qualification logic', 'Calendar booking for qualified leads', 'Proposal PDF generation'],
    funnel_steps: ['VSL Landing Page', 'Application Form', 'Qualification Review', 'Strategy Call Booking', 'Proposal & Close'],
    integrations: ['Video hosting', 'Calendar booking', 'Email CRM', 'PDF generation'],
    api_endpoints: ['/api/application/submit', '/api/qualify/score', '/api/proposal/generate', '/api/booking/strategy-call'],
    benefits: ['Pre-qualifies high-ticket buyers', 'Filters tire-kickers out', 'Books only qualified calls', 'Generates proposals automatically', 'Closes deals faster'],
  },
  {
    name: 'E-commerce Flash Sale',
    tagline: 'Run flash sales that sell out in hours',
    description: 'Flash sale system with countdown, limited inventory display, urgency messaging, fast checkout, and post-purchase cross-sell.',
    category: 'sales', revenue_potential: '$5k–$50k/sale', setup_time: '8 min', conversion_focus: 'Rapid purchases', use_case: 'E-commerce flash sales',
    backend_features: ['Countdown timer', 'Live inventory tracker', 'Urgency messaging system', 'One-page fast checkout', 'Post-purchase cross-sell'],
    funnel_steps: ['Flash Sale Page', 'Product Selection', 'Fast Checkout', 'Cross-Sell Offer', 'Order Confirmation'],
    integrations: ['Stripe payments', 'Inventory management', 'Email receipts', 'SMS alerts'],
    api_endpoints: ['/api/inventory/check', '/api/checkout/fast', '/api/cross-sell/offer', '/api/order/confirm'],
    benefits: ['Creates buying urgency', 'Shows live inventory', 'Speeds up checkout', 'Increases AOV with cross-sells', 'Sends instant confirmations'],
  },
  {
    name: 'Webinar Sales Pipeline',
    tagline: 'Sell through automated webinar funnels',
    description: 'Webinar funnel with registration page, reminder sequences, live/replay page, limited-time offer, checkout, and follow-up drip.',
    category: 'sales', revenue_potential: '$5k–$40k/mo', setup_time: '12 min', conversion_focus: 'Webinar registrations → sales', use_case: 'Webinar selling',
    backend_features: ['Registration with social proof', 'Multi-touch reminder sequence', 'Live webinar embed', 'Replay with expiry timer', 'Limited-time checkout page'],
    funnel_steps: ['Registration Page', 'Confirmation + Reminders', 'Live/Replay Webinar', 'Special Offer Page', 'Checkout', 'Follow-Up Drip'],
    integrations: ['Webinar platform', 'Email automation', 'Stripe checkout', 'Replay hosting'],
    api_endpoints: ['/api/webinar/register', '/api/reminder/send', '/api/offer/create', '/api/checkout/webinar'],
    benefits: ['Fills webinars on autopilot', 'Sends reminder sequences', 'Presents offer at peak interest', 'Creates time-limited urgency', 'Follows up non-buyers'],
  },
  {
    name: 'Subscription Box Funnel',
    tagline: 'Build recurring revenue with subscription boxes',
    description: 'Subscription commerce system with box customization, tiered plans, trial offer, recurring billing, and churn reduction flows.',
    category: 'sales', revenue_potential: '$5k–$30k/mo', setup_time: '12 min', conversion_focus: 'Subscription signups', use_case: 'Subscription commerce',
    backend_features: ['Box customization wizard', 'Tiered subscription plans', 'First-box trial offer', 'Recurring billing management', 'Churn prevention email flow'],
    funnel_steps: ['Landing Page', 'Customize Your Box', 'Select Plan', 'Trial Checkout', 'Welcome + Anticipation Emails'],
    integrations: ['Stripe subscriptions', 'Email sequences', 'Inventory tracking', 'Shipping labels'],
    api_endpoints: ['/api/box/customize', '/api/subscription/create', '/api/billing/manage', '/api/churn/prevent'],
    benefits: ['Builds recurring revenue', 'Lets customers customize', 'Converts with trial offer', 'Manages billing automatically', 'Reduces churn proactively'],
  },
  {
    name: 'Tripwire Sales System',
    tagline: 'Convert cold traffic with irresistible low-ticket offers',
    description: 'Tripwire funnel with $7-$47 front-end offer, immediate upsell ladder, order form with bump, and backend high-ticket ascension.',
    category: 'sales', revenue_potential: '$3k–$20k/mo', setup_time: '10 min', conversion_focus: 'Low-ticket to high-ticket', use_case: 'Funnel marketing',
    backend_features: ['Tripwire offer page', 'Order form with bump', 'One-click upsell #1', 'One-click upsell #2', 'Downsell alternative', 'Backend ascension email'],
    funnel_steps: ['Tripwire Offer', 'Checkout + Bump', 'Upsell #1', 'Upsell #2 / Downsell', 'Thank You', 'Ascension Emails'],
    integrations: ['Stripe payments', 'Email sequences', 'Analytics', 'Webhook triggers'],
    api_endpoints: ['/api/tripwire/checkout', '/api/upsell/offer', '/api/downsell/offer', '/api/ascension/email'],
    benefits: ['Acquires customers cheaply', 'Increases AOV with bumps', 'Ladders to higher offers', 'Downsells to save the sale', 'Ascends to backend offers'],
  },
  {
    name: 'Affiliate Sales Engine',
    tagline: 'Drive affiliate revenue with optimized landing pages',
    description: 'Affiliate marketing system with comparison pages, review content, CTA optimization, click tracking, and commission dashboard.',
    category: 'sales', revenue_potential: '$2k–$15k/mo', setup_time: '8 min', conversion_focus: 'Affiliate clicks → sales', use_case: 'Affiliate marketing',
    backend_features: ['Product comparison pages', 'Review content templates', 'CTA optimization system', 'Click and conversion tracking', 'Commission dashboard'],
    funnel_steps: ['SEO Landing Page', 'Product Comparison', 'In-Depth Review', 'CTA Click-Through', 'Conversion Tracking'],
    integrations: ['Affiliate networks', 'Analytics tracking', 'Email list building', 'SEO tools'],
    api_endpoints: ['/api/clicks/track', '/api/conversions/log', '/api/commission/calculate'],
    benefits: ['Ranks for buyer keywords', 'Compares products clearly', 'Tracks every click', 'Maximizes commission rates', 'Builds email list alongside'],
  },

  // ─── DIGITAL PRODUCTS (7) ──────────────────────────────────
  {
    name: 'Online Course Platform',
    tagline: 'Sell and deliver courses without the tech headache',
    description: 'Full course delivery system with sales page, checkout, student portal, lesson delivery, progress tracking, and certificate generation.',
    category: 'digital', revenue_potential: '$5k–$50k/mo', setup_time: '15 min', conversion_focus: 'Course enrollments', use_case: 'Online education',
    backend_features: ['Course sales page', 'Stripe checkout with plans', 'Student portal with auth', 'Drip lesson delivery', 'Progress tracking', 'Certificate generation'],
    funnel_steps: ['Sales Page', 'Checkout', 'Welcome + Login', 'Course Dashboard', 'Lesson Delivery', 'Certificate'],
    integrations: ['Stripe payments', 'Auth system', 'Email drip', 'Video hosting', 'PDF certificates'],
    api_endpoints: ['/api/course/enroll', '/api/lessons/unlock', '/api/progress/track', '/api/certificate/generate'],
    benefits: ['Sells courses 24/7', 'Delivers content automatically', 'Tracks student progress', 'Issues certificates', 'Manages subscriptions'],
  },
  {
    name: 'Ebook & Guide Seller',
    tagline: 'Monetize your expertise with digital downloads',
    description: 'Digital download system with sales page, instant delivery, reader tracking, review collection, and email list building through lead magnets.',
    category: 'digital', revenue_potential: '$1k–$10k/mo', setup_time: '8 min', conversion_focus: 'Digital download sales', use_case: 'Ebooks and guides',
    backend_features: ['Product sales page', 'Instant digital delivery', 'Download tracking', 'Reader review collection', 'Lead magnet opt-in for free chapters'],
    funnel_steps: ['Sales Page', 'Checkout', 'Instant Download', 'Review Request', 'Upsell Related Guides'],
    integrations: ['Stripe payments', 'File delivery', 'Email automation', 'Review system'],
    api_endpoints: ['/api/product/purchase', '/api/download/deliver', '/api/review/request', '/api/upsell/related'],
    benefits: ['Sells downloads instantly', 'Delivers files automatically', 'Builds email list', 'Collects social proof', 'Upsells related products'],
  },
  {
    name: 'Membership Community',
    tagline: 'Build a paid community that grows itself',
    description: 'Membership system with tiered access, content library, community feed, member directory, and recurring billing management.',
    category: 'digital', revenue_potential: '$3k–$30k/mo', setup_time: '15 min', conversion_focus: 'Membership signups', use_case: 'Paid communities',
    backend_features: ['Tiered membership plans', 'Gated content library', 'Community discussion feed', 'Member directory', 'Recurring billing with Stripe'],
    funnel_steps: ['Landing Page', 'Plan Selection', 'Checkout', 'Welcome Onboarding', 'Community Access'],
    integrations: ['Stripe subscriptions', 'Auth system', 'Email welcome sequence', 'Content management'],
    api_endpoints: ['/api/membership/subscribe', '/api/content/access', '/api/community/post', '/api/billing/manage'],
    benefits: ['Builds recurring revenue', 'Gates premium content', 'Fosters community', 'Reduces churn with engagement', 'Manages billing automatically'],
  },
  {
    name: 'Template & Asset Store',
    tagline: 'Sell design templates and digital assets',
    description: 'Digital asset marketplace with preview system, license management, instant download, bundle pricing, and creator dashboard.',
    category: 'digital', revenue_potential: '$2k–$20k/mo', setup_time: '12 min', conversion_focus: 'Asset purchases', use_case: 'Digital marketplace',
    backend_features: ['Asset preview system', 'License type selection', 'Instant file delivery', 'Bundle pricing engine', 'Creator earnings dashboard'],
    funnel_steps: ['Browse Assets', 'Preview & Details', 'Select License', 'Checkout', 'Instant Download'],
    integrations: ['Stripe payments', 'File storage', 'License management', 'Creator payouts'],
    api_endpoints: ['/api/assets/browse', '/api/license/select', '/api/purchase/complete', '/api/download/asset'],
    benefits: ['Showcases assets beautifully', 'Handles licensing automatically', 'Delivers files instantly', 'Supports bundle pricing', 'Tracks creator earnings'],
  },
  {
    name: 'Coaching Program Launcher',
    tagline: 'Sell and deliver 1-on-1 coaching programs',
    description: 'Coaching business system with program packages, application form, payment plans, session scheduling, and progress tracking.',
    category: 'digital', revenue_potential: '$5k–$40k/mo', setup_time: '10 min', conversion_focus: 'Program enrollments', use_case: 'Coaching business',
    backend_features: ['Program package display', 'Application/intake form', 'Payment plan options', 'Session scheduling', 'Client progress tracker'],
    funnel_steps: ['Program Overview', 'Apply / Intake', 'Accept & Pay', 'Schedule Sessions', 'Track Progress'],
    integrations: ['Stripe payment plans', 'Calendar booking', 'Email automation', 'Progress tracking'],
    api_endpoints: ['/api/program/apply', '/api/payment/plan', '/api/session/schedule', '/api/progress/update'],
    benefits: ['Sells coaching packages', 'Qualifies applicants', 'Offers payment plans', 'Schedules automatically', 'Tracks client outcomes'],
  },
  {
    name: 'Podcast Monetization Hub',
    tagline: 'Turn listeners into paying supporters',
    description: 'Podcast monetization system with episode player, premium content gate, sponsorship marketplace, merchandise store, and listener community.',
    category: 'digital', revenue_potential: '$1k–$15k/mo', setup_time: '10 min', conversion_focus: 'Premium subscriptions + merch', use_case: 'Podcast monetization',
    backend_features: ['Episode player and archive', 'Premium episode gate', 'Sponsorship inquiry system', 'Merch store integration', 'Listener community access'],
    funnel_steps: ['Podcast Landing', 'Free Episodes', 'Premium Upgrade', 'Merch Store', 'Community Join'],
    integrations: ['Stripe subscriptions', 'Audio hosting', 'E-commerce', 'Community platform'],
    api_endpoints: ['/api/episodes/list', '/api/premium/access', '/api/sponsors/inquiry', '/api/merch/purchase'],
    benefits: ['Monetizes listeners', 'Gates premium content', 'Attracts sponsors', 'Sells merchandise', 'Builds listener community'],
  },
  {
    name: 'SaaS Micro-Tool',
    tagline: 'Launch a micro-SaaS tool and charge monthly',
    description: 'Micro-SaaS launch system with tool landing page, free trial flow, usage-based billing, user dashboard, and feature request board.',
    category: 'digital', revenue_potential: '$2k–$20k/mo', setup_time: '15 min', conversion_focus: 'Trial → paid conversion', use_case: 'Micro-SaaS launch',
    backend_features: ['Tool landing page', 'Free trial signup', 'Usage tracking', 'Subscription billing', 'Feature request board'],
    funnel_steps: ['Landing Page', 'Start Free Trial', 'Tool Dashboard', 'Upgrade to Paid', 'Feature Requests'],
    integrations: ['Stripe subscriptions', 'Auth system', 'Usage analytics', 'Feedback board'],
    api_endpoints: ['/api/trial/start', '/api/usage/track', '/api/billing/upgrade', '/api/feedback/submit'],
    benefits: ['Launches SaaS quickly', 'Converts trials to paid', 'Tracks usage metrics', 'Manages subscriptions', 'Collects user feedback'],
  },

  // ─── PERSONAL BRAND (7) ────────────────────────────────────
  {
    name: 'Creator Portfolio Pro',
    tagline: 'Showcase your work and attract premium clients',
    description: 'Personal brand portfolio with project showcase, testimonial wall, about story, press mentions, contact form, and social media hub.',
    category: 'brand', revenue_potential: '$3k–$20k/mo', setup_time: '10 min', conversion_focus: 'Client inquiries', use_case: 'Creative professionals',
    backend_features: ['Project showcase gallery', 'Testimonial management', 'Press/media mentions', 'Contact and inquiry forms', 'Social media link hub'],
    funnel_steps: ['Portfolio Home', 'Project Detail', 'Testimonials', 'About / Story', 'Contact / Hire Me'],
    integrations: ['Email notifications', 'Social media links', 'Analytics', 'Calendar booking'],
    api_endpoints: ['/api/inquiry/submit', '/api/portfolio/projects', '/api/testimonials/list'],
    benefits: ['Showcases work beautifully', 'Builds professional credibility', 'Attracts premium clients', 'Collects testimonials', 'Centralizes social presence'],
  },
  {
    name: 'Speaker & Author Platform',
    tagline: 'Book speaking gigs and sell your books',
    description: 'Speaker platform with keynote topics, booking request form, book showcase, media kit download, and event calendar.',
    category: 'brand', revenue_potential: '$5k–$30k/mo', setup_time: '10 min', conversion_focus: 'Speaking bookings + book sales', use_case: 'Authors and speakers',
    backend_features: ['Keynote topics showcase', 'Speaking booking request', 'Book sales page', 'Media kit download', 'Event calendar'],
    funnel_steps: ['Speaker Home', 'Topics & Bio', 'Book Speaker', 'Buy Book', 'Media Kit'],
    integrations: ['Calendar booking', 'E-commerce (books)', 'Email list', 'Media downloads'],
    api_endpoints: ['/api/speaking/request', '/api/book/purchase', '/api/media-kit/download'],
    benefits: ['Attracts speaking gigs', 'Sells books online', 'Provides media kit', 'Builds authority', 'Grows email list'],
  },
  {
    name: 'Influencer Media Kit',
    tagline: 'Land brand deals with a professional presence',
    description: 'Influencer brand system with audience stats, content showcase, rate card, collaboration request form, and brand partnership page.',
    category: 'brand', revenue_potential: '$2k–$25k/mo', setup_time: '8 min', conversion_focus: 'Brand deal inquiries', use_case: 'Influencer monetization',
    backend_features: ['Audience demographics display', 'Content portfolio grid', 'Rate card with packages', 'Collaboration request form', 'Past partnerships showcase'],
    funnel_steps: ['Profile Landing', 'Content Portfolio', 'Audience Stats', 'Rate Card', 'Contact for Collab'],
    integrations: ['Email notifications', 'Analytics display', 'File downloads', 'Social links'],
    api_endpoints: ['/api/collab/request', '/api/media-kit/download', '/api/stats/display'],
    benefits: ['Impresses brand managers', 'Shows audience data', 'Displays professional rates', 'Streamlines deal requests', 'Showcases past partnerships'],
  },
  {
    name: 'Music Artist Hub',
    tagline: 'Build your fanbase and sell your music',
    description: 'Artist platform with music player, merch store, tour dates, fan email list, and EPK (Electronic Press Kit) for industry.',
    category: 'brand', revenue_potential: '$1k–$15k/mo', setup_time: '10 min', conversion_focus: 'Fan engagement + merch sales', use_case: 'Music artists',
    backend_features: ['Audio player with tracks', 'Merch store', 'Tour date calendar', 'Fan email signup', 'EPK for industry contacts'],
    funnel_steps: ['Artist Home', 'Listen to Music', 'Tour Dates', 'Merch Store', 'Join Fan Club'],
    integrations: ['Audio streaming', 'E-commerce', 'Email list', 'Calendar events'],
    api_endpoints: ['/api/tracks/list', '/api/merch/purchase', '/api/fanclub/join', '/api/epk/download'],
    benefits: ['Showcases music professionally', 'Sells merch directly', 'Promotes tour dates', 'Builds fan email list', 'Provides industry EPK'],
  },
  {
    name: 'Personal Trainer Brand',
    tagline: 'Build your fitness brand and sell programs online',
    description: 'Trainer brand system with transformation gallery, program sales, free workout lead magnet, consultation booking, and social proof.',
    category: 'brand', revenue_potential: '$3k–$20k/mo', setup_time: '10 min', conversion_focus: 'Program sales + bookings', use_case: 'Fitness professionals',
    backend_features: ['Transformation before/after gallery', 'Program sales pages', 'Free workout lead magnet', 'Consultation booking', 'Social proof and credentials'],
    funnel_steps: ['Trainer Home', 'Transformations', 'Programs', 'Free Workout Download', 'Book Consultation'],
    integrations: ['Stripe payments', 'Calendar booking', 'Email automation', 'File delivery'],
    api_endpoints: ['/api/program/purchase', '/api/leadmagnet/download', '/api/consultation/book'],
    benefits: ['Shows real results', 'Sells programs online', 'Captures leads with free content', 'Books consultations', 'Builds credibility'],
  },
  {
    name: 'Photographer Portfolio System',
    tagline: 'Book clients and deliver galleries professionally',
    description: 'Photography business system with portfolio galleries, package pricing, booking form, client gallery delivery, and print store.',
    category: 'brand', revenue_potential: '$3k–$15k/mo', setup_time: '10 min', conversion_focus: 'Session bookings', use_case: 'Photography business',
    backend_features: ['Portfolio gallery with categories', 'Package pricing display', 'Session booking form', 'Client gallery delivery', 'Print and digital store'],
    funnel_steps: ['Portfolio Home', 'Gallery Browse', 'Packages & Pricing', 'Book Session', 'Client Gallery'],
    integrations: ['Calendar booking', 'Stripe payments', 'Gallery hosting', 'Print fulfillment'],
    api_endpoints: ['/api/gallery/browse', '/api/session/book', '/api/client-gallery/access', '/api/prints/order'],
    benefits: ['Showcases work beautifully', 'Sells packages clearly', 'Books sessions online', 'Delivers galleries securely', 'Sells prints passively'],
  },
  {
    name: 'YouTube Creator Hub',
    tagline: 'Monetize your channel beyond AdSense',
    description: 'Creator monetization platform with video portfolio, premium membership, digital product store, sponsorship page, and community.',
    category: 'brand', revenue_potential: '$2k–$20k/mo', setup_time: '10 min', conversion_focus: 'Membership + product sales', use_case: 'YouTube creators',
    backend_features: ['Video portfolio embed', 'Premium membership tiers', 'Digital product store', 'Sponsorship inquiry page', 'Community / Discord link'],
    funnel_steps: ['Creator Home', 'Watch Content', 'Join Premium', 'Shop Products', 'Sponsor Inquiry'],
    integrations: ['YouTube embed', 'Stripe subscriptions', 'E-commerce', 'Community platform'],
    api_endpoints: ['/api/membership/join', '/api/products/purchase', '/api/sponsor/inquire'],
    benefits: ['Monetizes beyond ads', 'Sells premium access', 'Launches digital products', 'Attracts sponsors', 'Builds owned community'],
  },

  // ─── LOCAL BUSINESS (7) ────────────────────────────────────
  {
    name: 'Auto Shop Booking Pro',
    tagline: 'Book service appointments and sell maintenance plans',
    description: 'Auto repair system with service menu, online booking, maintenance plan subscriptions, vehicle history tracking, and review collection.',
    category: 'local', revenue_potential: '$5k–$25k/mo', setup_time: '10 min', conversion_focus: 'Service bookings', use_case: 'Auto repair shops',
    backend_features: ['Service menu with pricing', 'Online appointment booking', 'Maintenance plan subscriptions', 'Vehicle history tracking', 'Review request automation'],
    funnel_steps: ['Services Page', 'Book Appointment', 'Vehicle Info', 'Confirm & Pay', 'Maintenance Plan Upsell'],
    integrations: ['Calendar booking', 'Stripe payments', 'SMS reminders', 'Review platforms'],
    api_endpoints: ['/api/services/list', '/api/appointment/book', '/api/vehicle/history', '/api/plan/subscribe'],
    benefits: ['Books appointments online', 'Sells maintenance plans', 'Tracks vehicle history', 'Collects reviews', 'Reduces phone calls'],
  },
  {
    name: 'Dental Practice Growth',
    tagline: 'Fill your chair and grow your practice',
    description: 'Dental practice system with service pages, new patient offer, online scheduling, insurance checker, and patient review funnel.',
    category: 'local', revenue_potential: '$10k–$40k/mo', setup_time: '10 min', conversion_focus: 'New patient appointments', use_case: 'Dental practices',
    backend_features: ['Service showcase pages', 'New patient special offer', 'Online scheduling system', 'Insurance verification widget', 'Patient review collection'],
    funnel_steps: ['Services Landing', 'New Patient Offer', 'Check Insurance', 'Book Appointment', 'Post-Visit Review'],
    integrations: ['Calendar booking', 'Insurance APIs', 'Review platforms', 'SMS reminders'],
    api_endpoints: ['/api/insurance/check', '/api/appointment/new-patient', '/api/review/request'],
    benefits: ['Attracts new patients', 'Verifies insurance online', 'Books appointments 24/7', 'Collects patient reviews', 'Grows practice reputation'],
  },
  {
    name: 'Home Cleaning Service',
    tagline: 'Get bookings and build a cleaning empire',
    description: 'Cleaning service system with instant quote calculator, online booking, recurring service setup, before/after showcase, and referral program.',
    category: 'local', revenue_potential: '$3k–$15k/mo', setup_time: '8 min', conversion_focus: 'Service bookings', use_case: 'Cleaning businesses',
    backend_features: ['Instant quote calculator', 'Online booking with time slots', 'Recurring service subscription', 'Before/after photo showcase', 'Referral program tracker'],
    funnel_steps: ['Services Page', 'Get Instant Quote', 'Pick Time Slot', 'Book & Pay', 'Referral Offer'],
    integrations: ['Stripe payments', 'Calendar booking', 'SMS notifications', 'Referral tracking'],
    api_endpoints: ['/api/quote/instant', '/api/booking/create', '/api/recurring/setup', '/api/referral/track'],
    benefits: ['Provides instant quotes', 'Books online instantly', 'Sets up recurring clients', 'Shows quality with photos', 'Grows through referrals'],
  },
  {
    name: 'HVAC & Plumbing Pro',
    tagline: 'Emergency bookings and maintenance contracts',
    description: 'Home services system with emergency booking priority, service area checker, maintenance contract signup, seasonal promotion engine, and review wall.',
    category: 'local', revenue_potential: '$5k–$30k/mo', setup_time: '10 min', conversion_focus: 'Emergency + scheduled bookings', use_case: 'HVAC and plumbing',
    backend_features: ['Emergency priority booking', 'Service area ZIP checker', 'Maintenance contract signup', 'Seasonal promotion system', 'Review collection wall'],
    funnel_steps: ['Service Page', 'Emergency or Schedule?', 'Check Service Area', 'Book & Pay', 'Maintenance Contract Offer'],
    integrations: ['Calendar booking', 'Stripe payments', 'SMS dispatch', 'Review platforms'],
    api_endpoints: ['/api/emergency/book', '/api/service-area/check', '/api/contract/subscribe', '/api/promotion/display'],
    benefits: ['Captures emergency calls', 'Checks service area instantly', 'Sells maintenance contracts', 'Runs seasonal promotions', 'Builds review reputation'],
  },
  {
    name: 'Daycare & Childcare Center',
    tagline: 'Fill enrollment and keep parents informed',
    description: 'Childcare center system with program info, enrollment application, waitlist management, parent portal, and daily activity updates.',
    category: 'local', revenue_potential: '$5k–$25k/mo', setup_time: '12 min', conversion_focus: 'Enrollment applications', use_case: 'Childcare centers',
    backend_features: ['Program and age group info', 'Enrollment application form', 'Waitlist management', 'Parent communication portal', 'Daily activity reporting'],
    funnel_steps: ['Center Overview', 'Programs by Age', 'Schedule Tour', 'Apply for Enrollment', 'Parent Portal Access'],
    integrations: ['Calendar tours', 'Email automation', 'Parent portal', 'Billing system'],
    api_endpoints: ['/api/enrollment/apply', '/api/waitlist/join', '/api/tour/schedule', '/api/activity/report'],
    benefits: ['Fills enrollment spots', 'Manages waitlist', 'Schedules facility tours', 'Keeps parents informed', 'Streamlines billing'],
  },
  {
    name: 'Tutoring Center Hub',
    tagline: 'Enroll students and manage tutoring sessions',
    description: 'Tutoring business system with subject offerings, tutor profiles, assessment booking, enrollment flow, and progress reporting.',
    category: 'local', revenue_potential: '$3k–$20k/mo', setup_time: '10 min', conversion_focus: 'Assessment bookings + enrollment', use_case: 'Tutoring centers',
    backend_features: ['Subject and grade offerings', 'Tutor profiles and qualifications', 'Free assessment booking', 'Enrollment and payment', 'Student progress reports'],
    funnel_steps: ['Subjects Page', 'Meet Our Tutors', 'Book Free Assessment', 'Enroll & Pay', 'Progress Dashboard'],
    integrations: ['Calendar booking', 'Stripe payments', 'Email updates', 'Progress tracking'],
    api_endpoints: ['/api/assessment/book', '/api/enrollment/create', '/api/progress/report', '/api/tutor/match'],
    benefits: ['Showcases expertise', 'Books free assessments', 'Converts to enrollments', 'Tracks student progress', 'Matches right tutor'],
  },
  {
    name: 'Local Gym Launch System',
    tagline: 'Open strong with pre-sales and founding members',
    description: 'Gym launch system with founding member pricing, facility showcase, class schedule preview, pre-sale checkout, and referral incentive.',
    category: 'local', revenue_potential: '$5k–$30k/mo', setup_time: '10 min', conversion_focus: 'Founding memberships', use_case: 'Gym launches',
    backend_features: ['Founding member pricing tiers', 'Facility virtual tour', 'Class schedule preview', 'Pre-sale checkout with lock-in pricing', 'Referral reward program'],
    funnel_steps: ['Coming Soon Page', 'Facility Preview', 'Founding Member Offer', 'Pre-Sale Checkout', 'Refer & Earn'],
    integrations: ['Stripe subscriptions', 'Email countdown', 'Referral tracking', 'Calendar launch date'],
    api_endpoints: ['/api/presale/purchase', '/api/founding/enroll', '/api/referral/reward', '/api/launch/countdown'],
    benefits: ['Builds pre-launch buzz', 'Locks in founding members', 'Creates urgency with pricing', 'Grows through referrals', 'Generates revenue before doors open'],
  },
]

const SYSTEM_PROMPT = `You generate PREMIUM, ultra-polished, production-ready HTML landing pages for complete business systems. Output ONLY the HTML — no markdown, no explanations, no code fences.

This is NOT a basic template. This is a FULL REVENUE SYSTEM with frontend designed to convert visitors into paying customers.

RULES:
- Use inline <style> tag at the top for all CSS
- Include Google Fonts: Inter (body) + Space Grotesk or Outfit (headings)
- PREMIUM quality: CSS transitions on hover, gradient accents, glassmorphism, premium spacing
- Responsive design with CSS grid/flexbox
- Rich visual hierarchy with varying font sizes and weights
- For images use beautifully colored gradient divs
- MUST include: hero with clear value prop, how it works section, features/benefits grid, social proof/testimonials with numbers, pricing with highlighted tier, FAQ, strong CTA, footer
- Add trust elements: "Used by X businesses", star ratings, metric counters
- Include form elements that look functional (inputs, selects, buttons)
- Show the SYSTEM nature: backend features listed, integration logos placeholder, API mention
- Each system must feel like a $10,000+ custom-built business solution
- Use creative layouts: asymmetric grids, overlapping elements, full-bleed sections
- Add hover effects on all interactive elements
- Use semantic HTML, keep under 500 lines`

async function generateSystem(system: SystemDef, index: number): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Create a premium landing page for the "${system.name}" revenue system.

Tagline: "${system.tagline}"
Description: ${system.description}
Category: ${system.category}
Revenue Potential: ${system.revenue_potential}
Conversion Focus: ${system.conversion_focus}

This system includes these backend features: ${system.backend_features.join(', ')}
Funnel flow: ${system.funnel_steps.join(' → ')}
Integrations: ${system.integrations.join(', ')}

Key benefits to highlight: ${system.benefits.join(', ')}

Make this look like a $10k+ custom-built business system, not a basic template. System #${index + 1} of 42 — make the design UNIQUE.`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()
}

async function main() {
  console.log(`\n🚀 BAM OS — Revenue Systems Seeder`)
  console.log(`   Generating ${SYSTEMS.length} dedicated business systems...\n`)

  const BATCH_SIZE = 3 // Smaller batches for higher quality
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < SYSTEMS.length; i += BATCH_SIZE) {
    const batch = SYSTEMS.slice(i, i + BATCH_SIZE)
    console.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(SYSTEMS.length / BATCH_SIZE)} (systems ${i + 1}-${Math.min(i + BATCH_SIZE, SYSTEMS.length)})`)

    const results = await Promise.allSettled(
      batch.map(async (system, batchIdx) => {
        const globalIdx = i + batchIdx
        try {
          console.log(`   ⭐ ⏳ [${globalIdx + 1}] ${system.name} (${system.category})...`)
          const html = await generateSystem(system, globalIdx)

          const { error } = await supabase.from('revenue_systems').insert({
            name: system.name,
            tagline: system.tagline,
            description: system.description,
            category: system.category,
            revenue_potential: system.revenue_potential,
            setup_time: system.setup_time,
            conversion_focus: system.conversion_focus,
            use_case: system.use_case,
            html,
            backend_features: system.backend_features,
            funnel_steps: system.funnel_steps,
            integrations: system.integrations,
            api_endpoints: system.api_endpoints,
            benefits: system.benefits,
            launches: Math.floor(Math.random() * 200) + 50,
            avg_conversions: +(Math.random() * 4 + 1).toFixed(1),
          })

          if (error) throw error
          console.log(`   ⭐ ✅ [${globalIdx + 1}] ${system.name}`)
          return true
        } catch (err) {
          console.error(`   ❌ [${globalIdx + 1}] ${system.name}: ${err}`)
          return false
        }
      })
    )

    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) successCount++
      else errorCount++
    })

    if (i + BATCH_SIZE < SYSTEMS.length) {
      console.log(`   ⏸  Pausing 5s...\n`)
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  console.log(`\n✨ Done! ${successCount} revenue systems created, ${errorCount} errors.`)
  console.log(`   Lead Gen: 7 | Booking: 7 | Sales: 7 | Digital: 7 | Brand: 7 | Local: 7`)
  console.log(`   View at: beyondamedium.io/dashboard/premium-templates\n`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
