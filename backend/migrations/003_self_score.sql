-- =====================================================================
-- 003_self_score.sql
-- Thêm cột tự đánh giá điểm (0-100) vào bảng Assessments
-- Idempotent: kiểm tra tồn tại trước khi ALTER
-- =====================================================================

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

-- SelfScore: điểm doanh nghiệp tự đánh giá (0-100)
IF COL_LENGTH(N'dbo.Assessments', N'SelfScore') IS NULL
BEGIN
    ALTER TABLE dbo.Assessments
    ADD SelfScore DECIMAL(5,2) NULL;
END;
