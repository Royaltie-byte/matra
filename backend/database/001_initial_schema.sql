CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--CREATING ALL THE ENUMS FOR ALL THE 11 TABLES BEFORE THE ACTUAL TABLE DEFINITION.

--enum for Organization.

CREATE type organization_type AS ENUM(
  'PRIVATE',
  'COUNTY_GOVT',
  'NGO',
  'FAITH_BASED'
);

--enum for user

CREATE TYPE role_type AS ENUM (
  'SUPER_ADMIN',
  'HOSPITAL_ADMIN',
  'DOCTOR',
  'NURSE',
  'CHW'
);

-- enum for enrollment

CREATE TYPE enrollment_status AS ENUM (
  'ACTIVE',
  'COMPLETED',
  'WITHDRAWN'
);

--enums for deliver

CREATE TYPE types_of_delivery AS ENUM (
  'NORMAL',
  'CAESARIAN',
  'VACUUM',
  'FORCEPS'
);

CREATE TYPE outcomes_of_birth AS ENUM (
  'LIVE_BIRTH',
  'STILL_BIRTH'
  
);

CREATE TYPE placenta_delivery_type AS ENUM (
  'NORMAL',
  'MANUAL',
  'RETAINED'
);

--ENUMS under message

CREATE TYPE message_direction AS ENUM (
  'INBOUND',
  'OUTBOUND'
);

CREATE TYPE message_type AS ENUM (
  'CHECKIN_QUESTION',
  'CHECKIN_REPLY',
  'UNPROMPTED'
);

CREATE TYPE channel_type AS ENUM (
  'SMS',
  'WHATSAPP'
);

CREATE TYPE message_status AS ENUM (
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED'
);

--ENUMS of risk

CREATE TYPE risk_level AS ENUM (
  'LOW',
  'MODERATE',
  'HIGH',
  'EMERGENCY'
);

CREATE TYPE risk_trigger AS ENUM (
  'DISCHARGE',
  'SYMPTOM_REPORT',
  'MANUAL_REVIEW',
  'EPDS_SCREENING'
);

--ENUMS for escalation _crypto_aead_det_decrypt

CREATE TYPE escalation_status AS ENUM (
  'PENDING',
  'ACKNOWLEDGED',
  'RESOLVED',
  'ESCALATED'
);

CREATE TYPE roles_assignable AS ENUM (
  'NURSE',
  'SUPERVISOR',
  'DOCTOR'
);

--ENUMS FOR ESCALATION_RULE

CREATE TYPE escalation_channel AS ENUM (
  'SMS',
  'DASHBOARD',
  'BOTH'
);

--ENUMS FOR EPDS_ASSESMENT

CREATE TYPE epds_risk_level AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

CREATE TYPE epds_completion_status AS ENUM (
  'COMPLETED',
  'PARTIAL'
);


--END OF ENUMS

--THE ACTUAL TABLES.

--TABLE FOR ORGANIZATION.

CREATE TABLE organization(
  organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type organization_type NOT NULL,

  address TEXT,
  phone VARCHAR(50) ,
  email VARCHAR(255),

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ

);

--table for user

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(organization_id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(30) NOT NULL,

  password_hash TEXT NOT NULL,
  role role_type NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

--THE MOTHER table

CREATE TABLE mother (
  mother_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(organization_id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE,
  date_of_birth DATE,
  national_id VARCHAR(100),
  next_of_kin_name VARCHAR(100),
  next_of_kin_phone VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ 
);

--TABLE FOR ENROLLMENT

CREATE TABLE enrollment (
  enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id UUID NOT NULL REFERENCES mother(mother_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(organization_id) ON DELETE RESTRICT,
  enrolled_by UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  expected_end_date DATE DEFAULT (CURRENT_DATE + 42),
  status enrollment_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

--TABLE FOR DELIVERY

CREATE TABLE delivery (
  delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollment(enrollment_id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  delivery_type types_of_delivery NOT NULL,
  gestational_age_weeks INTEGER ,
  birth_outcome outcomes_of_birth NOT NULL,
  birth_weight_grams INTEGER,
  blood_loss_ml INTEGER,
  placenta_delivery placenta_delivery_type ,
  complications TEXT,
  existing_conditions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--TABLE FOR MESSAGE

CREATE TABLE message (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollment(enrollment_id) ON DELETE RESTRICT,
  direction message_direction NOT NULL,
  message_type message_type NOT NULL,
  content TEXT NOT NULL,
  parent_message_id UUID REFERENCES message(message_id) ON DELETE RESTRICT, --SELF REFERENCING
  channel channel_type NOT NULL,
  delivery_status message_status NOT NULL DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--TABLE FOR RISK entity

CREATE TABLE risk_assesment (
  risk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollment(enrollment_id) ON DELETE RESTRICT,
  score INTEGER NOT NULL,
  severity risk_level NOT NULL,
  trigger_type risk_trigger NOT NULL,
  triggered_by_message_id UUID  REFERENCES message(message_id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--renaming to the correct spelling,

ALTER TABLE risk_assesment
RENAME TO risk_assessment;


--TABLE FOR ESCALATION

CREATE TABLE escalation (
  escalation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID REFERENCES risk_assessment(risk_id) ON DELETE RESTRICT,
  enrollment_id UUID REFERENCES enrollment(enrollment_id) ON DELETE RESTRICT,
  severity risk_level NOT NULL, --COPIED FROM RISK_ASSESMENT
  status escalation_status NOT NULL,
  current_step INTEGER DEFAULT 1,
  assigned_role roles_assignable NOT NULL,
  assigned_to UUID REFERENCES users(user_id) ON DELETE RESTRICT,
  acknowledged_by UUID REFERENCES users(user_id) ON DELETE RESTRICT,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ

);

--table for escalation rule

CREATE TABLE escalation_rule (
  escalation_rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(organization_id) ON DELETE CASCADE,
  severity risk_level NOT NULL,
  step INTEGER NOT NULL,
  target_role roles_assignable NOT NULL,
  timeout_minutes INTEGER ,
  channel escalation_channel NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(organization_id,severity,step) --states this combination must be unique
);

--table for epds risk_assessment

CREATE TABLE epds_assessment (
  epds_assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollment(enrollment_id) ON DELETE RESTRICT,
  administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_score INTEGER NOT NULL,
  risk_level epds_risk_level NOT NULL,
  administered_by UUID REFERENCEs users(user_id) ON DELETE RESTRICT,
  status epds_completion_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--TABLE FOR EPDS response_type

CREATE TABLE epds_response (
  epds_response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epds_assessment_id UUID NOT NULL REFERENCES epds_assessment(epds_assessment_id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  response_score INTEGER NOT NULL CHECK (response_score BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (epds_assessment_id , question_number) -- to ensure no repeating question
);

--checking that all the tables have been formed successfully

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

--this code runs successfully.