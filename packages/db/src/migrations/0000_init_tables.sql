CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('farmer', 'buyer', 'logistics', 'admin');--> statement-breakpoint
CREATE TYPE "public"."buyer_sector" AS ENUM('processor', 'exporter', 'distributor', 'chr', 'cooperative', 'other');--> statement-breakpoint
CREATE TYPE "public"."certification_type" AS ENUM('organic', 'global_gap', 'label_maroc', 'fair_trade', 'other');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'negotiating', 'sold', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('cereals', 'olives', 'dates', 'citrus', 'vegetables', 'argan', 'legumes', 'other');--> statement-breakpoint
CREATE TYPE "public"."quality_grade" AS ENUM('premium', 'grade_a', 'grade_b', 'standard');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('open', 'matched', 'closed');--> statement-breakpoint
CREATE TYPE "public"."deal_status" AS ENUM('offer_made', 'negotiating', 'agreed', 'contract_signed', 'escrow_funded', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('pending', 'deposit_paid', 'fully_funded', 'released', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."logistics_status" AS ENUM('open', 'quoted', 'assigned', 'in_transit', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."truck_type" AS ENUM('standard', 'refrigerated', 'bulk');--> statement-breakpoint
CREATE TYPE "public"."price_source" AS ENUM('mawsim_transaction', 'onicl', 'admin_manual');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'bid', 'agree', 'fund', 'release', 'dispute');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"name" text NOT NULL,
	"image" text,
	"role" "role" NOT NULL,
	"phone" text,
	"region" text,
	"city" text,
	"password_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"ice" text,
	"rc" text,
	"sector" "buyer_sector" NOT NULL,
	"city" text NOT NULL,
	"verified_business" boolean DEFAULT false NOT NULL,
	"avg_rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"completed_deals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "farmer_certifications" (
	"id" text PRIMARY KEY NOT NULL,
	"farmer_id" text NOT NULL,
	"type" "certification_type" NOT NULL,
	"issued_by" text NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"document_key" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farmer_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"farm_name" text NOT NULL,
	"region" text NOT NULL,
	"commune" text,
	"farm_size_ha" real,
	"products" text[] DEFAULT '{}' NOT NULL,
	"bank_details_encrypted" text,
	"avg_rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"completed_deals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farmer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "logistics_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"phone" text NOT NULL,
	"region" text NOT NULL,
	"truck_types" text[] DEFAULT '{}' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"avg_rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logistics_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"farmer_id" text NOT NULL,
	"product_category" "product_category" NOT NULL,
	"product_variety" text,
	"quantity_qtx" integer NOT NULL,
	"quality_grade" "quality_grade" NOT NULL,
	"ask_price_per_qtx" bigint NOT NULL,
	"min_order_qtx" integer DEFAULT 1 NOT NULL,
	"harvest_date" timestamp with time zone,
	"available_until" timestamp with time zone NOT NULL,
	"region" text NOT NULL,
	"description" text,
	"photo_keys" text[] DEFAULT '{}' NOT NULL,
	"certification_ids" text[] DEFAULT '{}' NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"product_vector" vector(384),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" text PRIMARY KEY NOT NULL,
	"buyer_id" text NOT NULL,
	"product_category" text NOT NULL,
	"product_variety" text,
	"quantity_qtx_min" integer NOT NULL,
	"quantity_qtx_max" integer NOT NULL,
	"max_price_per_qtx" bigint,
	"required_quality_grade" text NOT NULL,
	"required_certifications" text[] DEFAULT '{}' NOT NULL,
	"delivery_region" text NOT NULL,
	"needed_by" timestamp with time zone NOT NULL,
	"description" text,
	"status" "rfq_status" DEFAULT 'open' NOT NULL,
	"matched_listing_ids" text[] DEFAULT '{}' NOT NULL,
	"product_vector" vector(384),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text,
	"rfq_id" text,
	"farmer_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"product_category" text NOT NULL,
	"product_variety" text,
	"quantity_qtx" integer NOT NULL,
	"agreed_price_per_qtx" bigint NOT NULL,
	"total_amount" bigint NOT NULL,
	"delivery_region" text NOT NULL,
	"delivery_date" timestamp with time zone NOT NULL,
	"status" "deal_status" DEFAULT 'offer_made' NOT NULL,
	"contract_key" text,
	"logistics_request_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"price_per_qtx" bigint NOT NULL,
	"quantity_qtx" integer NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrows" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"farmer_id" text NOT NULL,
	"gross_amount" bigint NOT NULL,
	"deposit" bigint NOT NULL,
	"remainder" bigint NOT NULL,
	"platform_fee_from_buyer" bigint NOT NULL,
	"platform_fee_from_farmer" bigint NOT NULL,
	"farmer_payout" bigint NOT NULL,
	"status" "escrow_status" DEFAULT 'pending' NOT NULL,
	"deposit_paid_at" timestamp with time zone,
	"fully_funded_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "escrows_deal_id_unique" UNIQUE("deal_id")
);
--> statement-breakpoint
CREATE TABLE "logistics_quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"price_quoted" bigint NOT NULL,
	"available_from" timestamp with time zone,
	"message" text,
	"accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"origin_region" text NOT NULL,
	"destination_region" text NOT NULL,
	"product_category" text NOT NULL,
	"weight_tonnes" real NOT NULL,
	"truck_type" "truck_type" DEFAULT 'standard' NOT NULL,
	"pickup_date" timestamp with time zone NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"status" "logistics_status" DEFAULT 'open' NOT NULL,
	"assigned_provider_id" text,
	"agreed_price" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_category" text NOT NULL,
	"product_variety" text,
	"region" text NOT NULL,
	"threshold_price_per_qtx" bigint NOT NULL,
	"direction" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_points" (
	"id" text PRIMARY KEY NOT NULL,
	"product_category" text NOT NULL,
	"product_variety" text,
	"region" text NOT NULL,
	"price_per_qtx" bigint NOT NULL,
	"source" "price_source" NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"reviewee_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"reviewer_role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event" text NOT NULL,
	"entity_id" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_certifications" ADD CONSTRAINT "farmer_certifications_farmer_id_farmer_profiles_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_profiles" ADD CONSTRAINT "logistics_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_farmer_id_farmer_profiles_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_buyer_id_buyer_profiles_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_farmer_id_farmer_profiles_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_buyer_id_buyer_profiles_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_buyer_id_buyer_profiles_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_farmer_id_farmer_profiles_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_quotes" ADD CONSTRAINT "logistics_quotes_request_id_logistics_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."logistics_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;