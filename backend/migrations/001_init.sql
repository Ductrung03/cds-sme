-- =====================================================================
-- 001_init.sql
-- Schema khởi tạo cho hệ thống đánh giá chuyển đổi số SME
-- SQL Server 2022
-- Idempotent: có thể chạy lại an toàn
-- =====================================================================

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

-- ---------------------------------------------------------------------
-- Users & Roles
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_Id DEFAULT NEWSEQUENTIALID(),
        Email           NVARCHAR(255)    NOT NULL,
        PasswordHash    NVARCHAR(255)    NOT NULL,
        FullName        NVARCHAR(255)    NOT NULL,
        Role            VARCHAR(20)      NOT NULL CONSTRAINT CK_Users_Role CHECK (Role IN ('user','admin')),
        OrganizationName NVARCHAR(255)   NULL,
        Phone           NVARCHAR(30)     NULL,
        IsActive        BIT              NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
        CreatedAt       DATETIME2(3)     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       DATETIME2(3)     NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id)
    );
    CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email);
END;

-- ---------------------------------------------------------------------
-- Industries (ngành)
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Industries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Industries (
        Id          INT              NOT NULL IDENTITY(1,1),
        Code        VARCHAR(50)      NOT NULL,
        Name        NVARCHAR(255)    NOT NULL,
        Description NVARCHAR(1000)   NULL,
        SortOrder   INT              NOT NULL CONSTRAINT DF_Industries_SortOrder DEFAULT 0,
        IsActive    BIT              NOT NULL CONSTRAINT DF_Industries_IsActive DEFAULT 1,
        CONSTRAINT PK_Industries PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UX_Industries_Code UNIQUE (Code)
    );
END;

-- ---------------------------------------------------------------------
-- QuestionnaireVersions
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.QuestionnaireVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.QuestionnaireVersions (
        Id          INT              NOT NULL IDENTITY(1,1),
        Code        VARCHAR(50)      NOT NULL,
        Name        NVARCHAR(255)    NOT NULL,
        Description NVARCHAR(2000)   NULL,
        IsActive    BIT              NOT NULL CONSTRAINT DF_QV_IsActive DEFAULT 0,
        CreatedAt   DATETIME2(3)     NOT NULL CONSTRAINT DF_QV_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_QuestionnaireVersions PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UX_QV_Code UNIQUE (Code)
    );
END;

-- ---------------------------------------------------------------------
-- QuestionGroups (nhóm câu hỏi: 1..7)
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.QuestionGroups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.QuestionGroups (
        Id                  INT              NOT NULL IDENTITY(1,1),
        QuestionnaireId     INT              NOT NULL,
        GroupNumber         INT              NOT NULL,        -- 1..7
        Name                NVARCHAR(255)    NOT NULL,
        Description         NVARCHAR(1000)   NULL,
        Weight              DECIMAL(9,4)     NOT NULL CONSTRAINT DF_QG_Weight DEFAULT 1,
        IsOptional          BIT              NOT NULL CONSTRAINT DF_QG_IsOptional DEFAULT 0,
        IsIndustrySpecific  BIT              NOT NULL CONSTRAINT DF_QG_IsIndustrySpecific DEFAULT 0,
        SortOrder           INT              NOT NULL CONSTRAINT DF_QG_SortOrder DEFAULT 0,
        CONSTRAINT PK_QuestionGroups PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_QG_QV FOREIGN KEY (QuestionnaireId) REFERENCES dbo.QuestionnaireVersions(Id),
        CONSTRAINT UX_QG_Version_Group UNIQUE (QuestionnaireId, GroupNumber)
    );
END;

-- ---------------------------------------------------------------------
-- Questions (câu hỏi chung; nhóm 7 sẽ liên kết qua IndustryQuestions)
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Questions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Questions (
        Id              INT              NOT NULL IDENTITY(1,1),
        GroupId         INT              NOT NULL,
        Code            VARCHAR(50)      NOT NULL,    -- ví dụ '1.1', '2.6'
        Content         NVARCHAR(2000)   NOT NULL,
        QuestionType    VARCHAR(20)      NOT NULL CONSTRAINT CK_Q_Type CHECK (QuestionType IN ('single','multiple','open')),
        AllowOther      BIT              NOT NULL CONSTRAINT DF_Q_AllowOther DEFAULT 0,
        IsOptional      BIT              NOT NULL CONSTRAINT DF_Q_IsOptional DEFAULT 0,
        MaxScore        DECIMAL(9,4)     NOT NULL CONSTRAINT DF_Q_MaxScore DEFAULT 1,
        SortOrder       INT              NOT NULL CONSTRAINT DF_Q_SortOrder DEFAULT 0,
        CONSTRAINT PK_Questions PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Q_Group FOREIGN KEY (GroupId) REFERENCES dbo.QuestionGroups(Id),
        CONSTRAINT UX_Q_Group_Code UNIQUE (GroupId, Code)
    );
END;

-- ---------------------------------------------------------------------
-- AnswerOptions
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.AnswerOptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AnswerOptions (
        Id          INT              NOT NULL IDENTITY(1,1),
        QuestionId  INT              NOT NULL,
        Code        VARCHAR(20)      NOT NULL,            -- A, B, C, OTHER...
        Content     NVARCHAR(1000)   NOT NULL,
        Score       DECIMAL(9,4)     NOT NULL CONSTRAINT DF_AO_Score DEFAULT 0,
        IsOther     BIT              NOT NULL CONSTRAINT DF_AO_IsOther DEFAULT 0,
        SortOrder   INT              NOT NULL CONSTRAINT DF_AO_SortOrder DEFAULT 0,
        CONSTRAINT PK_AnswerOptions PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_AO_Q FOREIGN KEY (QuestionId) REFERENCES dbo.Questions(Id) ON DELETE CASCADE,
        CONSTRAINT UX_AO_Question_Code UNIQUE (QuestionId, Code)
    );
END;

-- ---------------------------------------------------------------------
-- IndustryQuestions: nhóm 7 - câu hỏi theo ngành
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.IndustryQuestions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.IndustryQuestions (
        Id          INT              NOT NULL IDENTITY(1,1),
        IndustryId  INT              NOT NULL,
        QuestionId  INT              NOT NULL,
        SortOrder   INT              NOT NULL CONSTRAINT DF_IQ_SortOrder DEFAULT 0,
        CONSTRAINT PK_IndustryQuestions PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_IQ_Industry FOREIGN KEY (IndustryId) REFERENCES dbo.Industries(Id),
        CONSTRAINT FK_IQ_Question FOREIGN KEY (QuestionId) REFERENCES dbo.Questions(Id),
        CONSTRAINT UX_IQ UNIQUE (IndustryId, QuestionId)
    );
END;

-- ---------------------------------------------------------------------
-- Solutions (giải pháp công nghệ - Phụ lục 3)
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Solutions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Solutions (
        Id          INT              NOT NULL IDENTITY(1,1),
        IndustryId  INT              NOT NULL,
        Code        VARCHAR(50)      NOT NULL,
        Name        NVARCHAR(500)    NOT NULL,
        Description NVARCHAR(2000)   NULL,
        SortOrder   INT              NOT NULL CONSTRAINT DF_S_SortOrder DEFAULT 0,
        IsActive    BIT              NOT NULL CONSTRAINT DF_S_IsActive DEFAULT 1,
        CONSTRAINT PK_Solutions PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_S_Industry FOREIGN KEY (IndustryId) REFERENCES dbo.Industries(Id),
        CONSTRAINT UX_S_Industry_Code UNIQUE (IndustryId, Code)
    );
END;

-- ---------------------------------------------------------------------
-- SolutionDependencies: cột "Phụ thuộc vào" trong Phụ lục 3
-- Nếu solution có >=1 dependency -> điểm 0.5, ngược lại 1.0
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.SolutionDependencies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SolutionDependencies (
        Id                  INT              NOT NULL IDENTITY(1,1),
        SolutionId          INT              NOT NULL,
        DependsOnSolutionId INT              NOT NULL,
        Note                NVARCHAR(500)    NULL,
        CONSTRAINT PK_SolutionDependencies PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_SD_Solution FOREIGN KEY (SolutionId) REFERENCES dbo.Solutions(Id),
        CONSTRAINT FK_SD_DependsOn FOREIGN KEY (DependsOnSolutionId) REFERENCES dbo.Solutions(Id),
        CONSTRAINT UX_SD UNIQUE (SolutionId, DependsOnSolutionId),
        CONSTRAINT CK_SD_NoSelf CHECK (SolutionId <> DependsOnSolutionId)
    );
END;

-- ---------------------------------------------------------------------
-- RankThresholds: 5 cấp xếp hạng dựa trên điểm chuẩn hóa 0-100
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.RankThresholds', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RankThresholds (
        Id          INT              NOT NULL IDENTITY(1,1),
        Level       INT              NOT NULL,   -- 1..5
        Code        VARCHAR(20)      NOT NULL,
        Name        NVARCHAR(100)    NOT NULL,
        MinScore    DECIMAL(7,2)     NOT NULL,
        MaxScore    DECIMAL(7,2)     NOT NULL,
        Description NVARCHAR(500)    NULL,
        CONSTRAINT PK_RankThresholds PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UX_Rank_Level UNIQUE (Level)
    );
END;

-- ---------------------------------------------------------------------
-- Assessments (mỗi lần khảo sát của user)
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Assessments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Assessments (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_A_Id DEFAULT NEWSEQUENTIALID(),
        UserId              UNIQUEIDENTIFIER NOT NULL,
        QuestionnaireId     INT              NOT NULL,
        IndustryId          INT              NULL,
        OrganizationName    NVARCHAR(255)    NULL,
        ContactName         NVARCHAR(255)    NULL,
        ContactEmail        NVARCHAR(255)    NULL,
        ContactPhone        NVARCHAR(30)     NULL,
        Status              VARCHAR(20)      NOT NULL CONSTRAINT CK_A_Status
                              CHECK (Status IN ('draft','submitted','scored','published'))
                              CONSTRAINT DF_A_Status DEFAULT 'draft',
        SubmittedAt         DATETIME2(3)     NULL,
        ScoredAt            DATETIME2(3)     NULL,
        PublishedAt         DATETIME2(3)     NULL,
        ScoredByUserId      UNIQUEIDENTIFIER NULL,
        CreatedAt           DATETIME2(3)     NOT NULL CONSTRAINT DF_A_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt           DATETIME2(3)     NOT NULL CONSTRAINT DF_A_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Assessments PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_A_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_A_QV FOREIGN KEY (QuestionnaireId) REFERENCES dbo.QuestionnaireVersions(Id),
        CONSTRAINT FK_A_Industry FOREIGN KEY (IndustryId) REFERENCES dbo.Industries(Id),
        CONSTRAINT FK_A_ScoredBy FOREIGN KEY (ScoredByUserId) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_A_UserId_Status ON dbo.Assessments(UserId, Status);
    CREATE INDEX IX_A_Status_SubmittedAt ON dbo.Assessments(Status, SubmittedAt);
END;

-- ---------------------------------------------------------------------
-- AssessmentAnswers
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.AssessmentAnswers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssessmentAnswers (
        Id              BIGINT           NOT NULL IDENTITY(1,1),
        AssessmentId    UNIQUEIDENTIFIER NOT NULL,
        QuestionId      INT              NOT NULL,
        OptionId        INT              NULL,            -- NULL khi đáp án "Khác" thuần text
        OtherText       NVARCHAR(2000)   NULL,
        OpenText        NVARCHAR(2000)   NULL,            -- cho câu hỏi type 'open'
        CreatedAt       DATETIME2(3)     NOT NULL CONSTRAINT DF_AA_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AssessmentAnswers PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_AA_Assessment FOREIGN KEY (AssessmentId) REFERENCES dbo.Assessments(Id) ON DELETE CASCADE,
        CONSTRAINT FK_AA_Question FOREIGN KEY (QuestionId) REFERENCES dbo.Questions(Id),
        CONSTRAINT FK_AA_Option FOREIGN KEY (OptionId) REFERENCES dbo.AnswerOptions(Id)
    );
    CREATE INDEX IX_AA_Assessment ON dbo.AssessmentAnswers(AssessmentId, QuestionId);
END;

-- ---------------------------------------------------------------------
-- AssessmentSolutions: ghi nhận giải pháp đã chọn (nhóm 7)
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.AssessmentSolutions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssessmentSolutions (
        Id              BIGINT           NOT NULL IDENTITY(1,1),
        AssessmentId    UNIQUEIDENTIFIER NOT NULL,
        SolutionId      INT              NOT NULL,
        IsSelected      BIT              NOT NULL CONSTRAINT DF_AS_IsSelected DEFAULT 1,
        AdminScore      DECIMAL(9,4)     NULL,  -- điểm admin chấm riêng nếu cần override
        Note            NVARCHAR(1000)   NULL,
        CONSTRAINT PK_AssessmentSolutions PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_AS_Assessment FOREIGN KEY (AssessmentId) REFERENCES dbo.Assessments(Id) ON DELETE CASCADE,
        CONSTRAINT FK_AS_Solution FOREIGN KEY (SolutionId) REFERENCES dbo.Solutions(Id),
        CONSTRAINT UX_AS UNIQUE (AssessmentId, SolutionId)
    );
END;

-- ---------------------------------------------------------------------
-- OtherAnswerReviews: review của admin/AI cho đáp án "Khác"
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.OtherAnswerReviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OtherAnswerReviews (
        Id                  BIGINT           NOT NULL IDENTITY(1,1),
        AnswerId            BIGINT           NOT NULL,
        AiSuggestion        NVARCHAR(2000)   NULL,
        AiConfidence        DECIMAL(5,4)     NULL,
        AiRelevant          BIT              NULL,
        AdminScore          DECIMAL(9,4)     NULL,
        AdminComment        NVARCHAR(2000)   NULL,
        ReviewedByUserId    UNIQUEIDENTIFIER NULL,
        ReviewedAt          DATETIME2(3)     NULL,
        CreatedAt           DATETIME2(3)     NOT NULL CONSTRAINT DF_OAR_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_OtherAnswerReviews PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_OAR_Answer FOREIGN KEY (AnswerId) REFERENCES dbo.AssessmentAnswers(Id) ON DELETE CASCADE,
        CONSTRAINT FK_OAR_Reviewer FOREIGN KEY (ReviewedByUserId) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_OAR_Answer ON dbo.OtherAnswerReviews(AnswerId);
END;

-- ---------------------------------------------------------------------
-- AssessmentScores: kết quả tính điểm
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.AssessmentScores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssessmentScores (
        Id                  BIGINT           NOT NULL IDENTITY(1,1),
        AssessmentId        UNIQUEIDENTIFIER NOT NULL,
        RawScore            DECIMAL(12,4)    NOT NULL,
        SolutionScore       DECIMAL(12,4)    NOT NULL,
        TopsisScore         DECIMAL(12,6)    NOT NULL,    -- closeness coefficient C*
        NormalizedScore     DECIMAL(7,2)     NOT NULL,    -- 0..100
        RankLevel           INT              NOT NULL,    -- 1..5
        RankName            NVARCHAR(100)    NOT NULL,
        GroupBreakdown      NVARCHAR(MAX)    NOT NULL,    -- JSON
        Details             NVARCHAR(MAX)    NULL,        -- JSON debug/diagnostics
        IsOverridden        BIT              NOT NULL CONSTRAINT DF_AS2_IsOverridden DEFAULT 0,
        OverrideReason      NVARCHAR(2000)   NULL,
        ComputedAt          DATETIME2(3)     NOT NULL CONSTRAINT DF_AS2_ComputedAt DEFAULT SYSUTCDATETIME(),
        ComputedByUserId    UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_AssessmentScores PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_AS2_Assessment FOREIGN KEY (AssessmentId) REFERENCES dbo.Assessments(Id) ON DELETE CASCADE,
        CONSTRAINT FK_AS2_ComputedBy FOREIGN KEY (ComputedByUserId) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_AS2_Assessment ON dbo.AssessmentScores(AssessmentId, ComputedAt DESC);
END;

-- ---------------------------------------------------------------------
-- AuditLogs
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        Id              BIGINT           NOT NULL IDENTITY(1,1),
        ActorUserId     UNIQUEIDENTIFIER NULL,
        Action          VARCHAR(100)     NOT NULL,
        EntityType      VARCHAR(50)      NOT NULL,
        EntityId        NVARCHAR(100)    NOT NULL,
        Payload         NVARCHAR(MAX)    NULL,    -- JSON
        IpAddress       VARCHAR(64)      NULL,
        UserAgent       NVARCHAR(500)    NULL,
        CreatedAt       DATETIME2(3)     NOT NULL CONSTRAINT DF_AL_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AuditLogs PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_AL_Actor FOREIGN KEY (ActorUserId) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_AL_Entity ON dbo.AuditLogs(EntityType, EntityId, CreatedAt DESC);
END;

PRINT N'Migration 001_init.sql hoàn tất.';
