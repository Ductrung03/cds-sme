export type UserRole = "user" | "admin";
export type AssessmentStatus = "draft" | "submitted" | "scored" | "published";
export type QuestionType = "single" | "multiple" | "open";

export interface UserRow {
  Id: string; // GUID
  Email: string;
  PasswordHash: string;
  FullName: string;
  Role: UserRole;
  OrganizationName: string | null;
  Phone: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface IndustryRow {
  Id: number;
  Code: string;
  Name: string;
  Description: string | null;
  SortOrder: number;
  IsActive: boolean;
}

export interface QuestionnaireVersionRow {
  Id: number;
  Code: string;
  Name: string;
  Description: string | null;
  IsActive: boolean;
  CreatedAt: string;
}

export interface QuestionGroupRow {
  Id: number;
  QuestionnaireId: number;
  GroupNumber: number;
  Name: string;
  Description: string | null;
  Weight: number;
  IsOptional: boolean;
  IsIndustrySpecific: boolean;
  SortOrder: number;
}

export interface QuestionRow {
  Id: number;
  GroupId: number;
  Code: string;
  Content: string;
  QuestionType: QuestionType;
  AllowOther: boolean;
  IsOptional: boolean;
  MaxScore: number;
  SortOrder: number;
}

export interface AnswerOptionRow {
  Id: number;
  QuestionId: number;
  Code: string;
  Content: string;
  Score: number;
  IsOther: boolean;
  SortOrder: number;
}

export interface IndustryQuestionRow {
  Id: number;
  IndustryId: number;
  QuestionId: number;
  SortOrder: number;
}

export interface SolutionRow {
  Id: number;
  IndustryId: number;
  Code: string;
  Name: string;
  Description: string | null;
  SortOrder: number;
  IsActive: boolean;
}

export interface SolutionDependencyRow {
  Id: number;
  SolutionId: number;
  DependsOnSolutionId: number;
  Note: string | null;
}

export interface RankThresholdRow {
  Id: number;
  Level: number;
  Code: string;
  Name: string;
  MinScore: number;
  MaxScore: number;
  Description: string | null;
}

export interface AssessmentRow {
  Id: string;
  UserId: string;
  QuestionnaireId: number;
  IndustryId: number | null;
  OrganizationName: string | null;
  ContactName: string | null;
  ContactEmail: string | null;
  ContactPhone: string | null;
  Status: AssessmentStatus;
  SubmittedAt: string | null;
  ScoredAt: string | null;
  PublishedAt: string | null;
  ScoredByUserId: string | null;
  ExperienceRating: number | null;
  ExperienceComment: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface AssessmentAnswerRow {
  Id: number;
  AssessmentId: string;
  QuestionId: number;
  OptionId: number | null;
  OtherText: string | null;
  OpenText: string | null;
  CreatedAt: string;
}

export interface AssessmentSolutionRow {
  Id: number;
  AssessmentId: string;
  SolutionId: number;
  IsSelected: boolean;
  AdminScore: number | null;
  Note: string | null;
}

export interface OtherAnswerReviewRow {
  Id: number;
  AnswerId: number;
  AiSuggestion: string | null;
  AiConfidence: number | null;
  AiRelevant: boolean | null;
  AdminScore: number | null;
  AdminComment: string | null;
  ReviewedByUserId: string | null;
  ReviewedAt: string | null;
  CreatedAt: string;
}

export interface AssessmentScoreRow {
  Id: number;
  AssessmentId: string;
  RawScore: number;
  SolutionScore: number;
  TopsisScore: number;
  NormalizedScore: number;
  RankLevel: number;
  RankName: string;
  GroupBreakdown: string; // JSON
  Details: string | null; // JSON
  IsOverridden: boolean;
  OverrideReason: string | null;
  ComputedAt: string;
  ComputedByUserId: string | null;
}

export interface AuditLogRow {
  Id: number;
  ActorUserId: string | null;
  Action: string;
  EntityType: string;
  EntityId: string;
  Payload: string | null;
  IpAddress: string | null;
  UserAgent: string | null;
  CreatedAt: string;
}
