-- =====================================================================
-- 002_feedback.sql
-- Thêm cột đánh giá trải nghiệm khảo sát vào bảng Assessments
-- Idempotent: kiểm tra tồn tại trước khi ALTER
-- =====================================================================

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

-- ExperienceRating: đánh giá mức độ hài lòng 1-5
IF COL_LENGTH(N'dbo.Assessments', N'ExperienceRating') IS NULL
BEGIN
    ALTER TABLE dbo.Assessments
    ADD ExperienceRating DECIMAL(3,1) NULL;
END;

-- ExperienceComment: nhận xét/góp ý thêm
IF COL_LENGTH(N'dbo.Assessments', N'ExperienceComment') IS NULL
BEGIN
    ALTER TABLE dbo.Assessments
    ADD ExperienceComment NVARCHAR(2000) NULL;
END;
