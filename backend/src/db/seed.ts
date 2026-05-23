import { getPool, sql } from "./pool";
import { logger } from "../utils/logger";
import bcrypt from "bcryptjs";

const HASH_ROUNDS = 10;

const hashPw = (pw: string): string => bcrypt.hashSync(pw, HASH_ROUNDS);

const n = (s: string): string => s;

const seed = async (): Promise<void> => {
  const pool = await getPool();
  const tx = pool.transaction();
  await tx.begin();
  try {
    const req = () => tx.request();

    // ===================================================================
    // 1. Users - idempotent: đảm bảo các tài khoản demo luôn tồn tại
    // ===================================================================
    logger.info("Đang seed Users (idempotent)...");
    const adminHash = hashPw("Admin@2026!");
    const userHash = hashPw("User@2026!");

    interface DemoUser {
      email: string;
      passwordHash: string;
      fullName: string;
      role: "admin" | "user";
      organizationName?: string;
    }

    const demoUsers: DemoUser[] = [
      // Quản trị viên
      { email: "admin@cds.vn",         passwordHash: adminHash, fullName: "Quản trị viên",                 role: "admin" },
      { email: "chuyenvien@cds.vn",    passwordHash: adminHash, fullName: "Chuyên viên đánh giá",          role: "admin" },

      // Người dùng / doanh nghiệp
      { email: "user@cds.vn",          passwordHash: userHash,  fullName: "Nguyễn Văn Demo",                role: "user" },
      { email: "doanhnghiep@demo.vn",  passwordHash: userHash,  fullName: "Doanh nghiệp Demo",              role: "user", organizationName: "Công ty TNHH Demo" },
      { email: "banle@demo.vn",        passwordHash: userHash,  fullName: "Doanh nghiệp Bán lẻ",            role: "user", organizationName: "Siêu thị Bán lẻ Demo" },
      { email: "logistics@demo.vn",    passwordHash: userHash,  fullName: "Doanh nghiệp Logistics",         role: "user", organizationName: "Công ty Logistics Demo" },
      { email: "giaoduc@demo.vn",      passwordHash: userHash,  fullName: "Cơ sở Giáo dục đào tạo",         role: "user", organizationName: "Trung tâm Giáo dục Demo" },
      { email: "khachsan@demo.vn",     passwordHash: userHash,  fullName: "Khách sạn Demo",                 role: "user", organizationName: "Khách sạn Demo Resort" },
      { email: "duocpham@demo.vn",     passwordHash: userHash,  fullName: "Doanh nghiệp Dược phẩm",         role: "user", organizationName: "Công ty Dược phẩm Demo" },
      { email: "nhahang@demo.vn",      passwordHash: userHash,  fullName: "Nhà hàng Demo",                  role: "user", organizationName: "Nhà hàng Ẩm thực Demo" },
      { email: "nongnghiep@demo.vn",   passwordHash: userHash,  fullName: "Hợp tác xã Nông nghiệp",         role: "user", organizationName: "HTX Nông nghiệp Demo" },
      { email: "xaydung@demo.vn",      passwordHash: userHash,  fullName: "Doanh nghiệp Xây dựng",          role: "user", organizationName: "Công ty Xây dựng Demo" },
    ];

    let insertedCount = 0;
    let updatedCount = 0;
    for (const u of demoUsers) {
      const found = await req()
        .input("email", sql.NVarChar(255), u.email)
        .query("SELECT Id FROM dbo.Users WHERE Email = @email");

      if (found.recordset.length === 0) {
        await req()
          .input("email", sql.NVarChar(255), u.email)
          .input("hash", sql.NVarChar(255), u.passwordHash)
          .input("name", sql.NVarChar(255), u.fullName)
          .input("role", sql.VarChar(20), u.role)
          .input("org", sql.NVarChar(255), u.organizationName ?? null)
          .query(`
            INSERT INTO dbo.Users (Email, PasswordHash, FullName, Role, OrganizationName, IsActive)
            VALUES (@email, @hash, @name, @role, @org, 1)
          `);
        insertedCount += 1;
      } else {
        // Bỏ qua password để tránh ghi đè khi admin đã đổi; chỉ refresh thông tin cơ bản
        await req()
          .input("email", sql.NVarChar(255), u.email)
          .input("name", sql.NVarChar(255), u.fullName)
          .input("role", sql.VarChar(20), u.role)
          .input("org", sql.NVarChar(255), u.organizationName ?? null)
          .query(`
            UPDATE dbo.Users
            SET FullName = @name,
                Role = @role,
                OrganizationName = COALESCE(@org, OrganizationName),
                IsActive = 1,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Email = @email
          `);
        updatedCount += 1;
      }
    }
    logger.info(`Users seed: ${insertedCount} mới, ${updatedCount} cập nhật (tổng ${demoUsers.length} tài khoản demo)`);

    // ===================================================================
    // 2. Industries (25 ngành theo Phụ lục I PDF)
    // ===================================================================
    logger.info("Đang seed Industries...");
    const indList = [
      { code: "IND01", name: "Bán lẻ" },
      { code: "IND02", name: "Sắt thép" },
      { code: "IND03", name: "Du lịch, lữ hành" },
      { code: "IND04", name: "Ô tô – xe máy" },
      { code: "IND05", name: "Sức khỏe, sắc đẹp" },
      { code: "IND06", name: "Môi trường" },
      { code: "IND07", name: "Vận tải hành khách" },
      { code: "IND08", name: "Giáo dục đào tạo" },
      { code: "IND09", name: "Lưu trú, khách sạn" },
      { code: "IND10", name: "Bất động sản" },
      { code: "IND11", name: "Dược phẩm" },
      { code: "IND12", name: "Dịch vụ kế toán" },
      { code: "IND13", name: "Ăn uống, nhà hàng" },
      { code: "IND14", name: "Cao su" },
      { code: "IND15", name: "Logistics" },
      { code: "IND16", name: "Nông nghiệp" },
      { code: "IND17", name: "Nhựa" },
      { code: "IND18", name: "May mặc" },
      { code: "IND19", name: "Gas - xăng dầu" },
      { code: "IND20", name: "Thiết bị y tế" },
      { code: "IND21", name: "Khoáng sản" },
      { code: "IND22", name: "Thủy sản" },
      { code: "IND23", name: "Bao bì" },
      { code: "IND24", name: "Giấy" },
      { code: "IND25", name: "Xây dựng" },
    ];

    let indInserted = 0;
    let indUpdated = 0;

    for (let i = 0; i < indList.length; i++) {
      const existing = await req()
        .input("code", sql.NVarChar(50), indList[i].code)
        .query("SELECT ID FROM dbo.Industries WHERE Code = @code");

      if (existing.recordset.length === 0) {
        await req()
          .input("code", sql.NVarChar(50), indList[i].code)
          .input("name", sql.NVarChar(255), indList[i].name)
          .input("sort", sql.Int, i)
          .query("INSERT INTO dbo.Industries (Code, Name, SortOrder) VALUES (@code, @name, @sort)");
        indInserted += 1;
      } else {
        await req()
          .input("code", sql.NVarChar(50), indList[i].code)
          .input("name", sql.NVarChar(255), indList[i].name)
          .input("sort", sql.Int, i)
          .query(`
            UPDATE dbo.Industries 
            SET Name = @name, 
                SortOrder = @sort,
                IsActive = 1,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Code = @code
          `);
        indUpdated += 1;
      }
    }
    logger.info(`Industries seed: ${indInserted} mới, ${indUpdated} cập nhật (tổng ${indList.length} ngành)`);

    // ===================================================================
    // 3. QuestionnaireVersion
    // ===================================================================
    logger.info("Đang seed QuestionnaireVersions...");
    if ((await req().query("SELECT COUNT(1) cnt FROM dbo.QuestionnaireVersions")).recordset[0].cnt === 0) {
      await req().query(`
        INSERT INTO dbo.QuestionnaireVersions (Code, Name, Description, IsActive)
        VALUES (N'V1.0', N'Phiên bản 1.0 - 2026', N'Bộ tiêu chí đánh giá chuyển đổi số SME theo Phụ lục I', 1)
      `);
      logger.info("Seeded questionnaire V1.0");
    }

    // ===================================================================
    // 4. QuestionGroups (7 nhóm theo PDF)
    // ===================================================================
    logger.info("Đang seed QuestionGroups...");
    if ((await req().query("SELECT COUNT(1) cnt FROM dbo.QuestionGroups")).recordset[0].cnt === 0) {
      await req().query(`
        INSERT INTO dbo.QuestionGroups (QuestionnaireId, GroupNumber, Name, Weight, IsOptional, IsIndustrySpecific, SortOrder)
        VALUES
          (1, 1, N'Nhóm 1: Thông tin chung',                                1, 0, 0, 1),
          (1, 2, N'Nhóm 2: Hạ tầng và ứng dụng công nghệ số',                1, 0, 0, 2),
          (1, 3, N'Nhóm 3: Nhận thức và chiến lược chuyển đổi số',           1, 0, 0, 3),
          (1, 4, N'Nhóm 4: Rào cản và nhu cầu hỗ trợ',                      1, 0, 0, 4),
          (1, 5, N'Nhóm 5: Mục tiêu và định hướng',                          1, 0, 0, 5),
          (1, 6, N'Nhóm 6: Chia sẻ thêm',                                    1, 1, 0, 6),
          (1, 7, N'Nhóm 7: Giải pháp công nghệ theo ngành',                  1, 0, 1, 7)
      `);
      logger.info("Seeded 7 question groups");
    }

    // ===================================================================
    // 5. Common Questions (nhóm 1-6 theo PDF)
    // ===================================================================
    logger.info("Đang seed Questions...");
    if ((await req().query("SELECT COUNT(1) cnt FROM dbo.Questions")).recordset[0].cnt === 0) {
      const qData = [
        { gid: 1, code: "1.1", content: "Số lượng lao động hiện tại của doanh nghiệp?", qType: "single", ao: false },
        { gid: 1, code: "1.2", content: "Doanh thu năm gần nhất của doanh nghiệp?", qType: "single", ao: false },
        { gid: 2, code: "2.1", content: "Doanh nghiệp sử dụng điện toán đám mây (cloud) trong hoạt động?", qType: "multiple", ao: true },
        { gid: 2, code: "2.2", content: "Mức độ tự động hóa quy trình sản xuất/kinh doanh?", qType: "single", ao: false },
        { gid: 2, code: "2.3", content: "Doanh nghiệp có sử dụng công cụ phân tích dữ liệu không?", qType: "single", ao: false },
        { gid: 2, code: "2.4", content: "Doanh nghiệp áp dụng biện pháp an toàn thông tin nào?", qType: "multiple", ao: true },
        { gid: 2, code: "2.5", content: "Doanh nghiệp sử dụng kênh giao tiếp khách hàng số?", qType: "multiple", ao: true },
        { gid: 2, code: "2.6", content: "Tự đánh giá mức độ thâm nhập công nghệ số?", qType: "single", ao: false },
        { gid: 3, code: "3.1", content: "Doanh nghiệp hiểu về chuyển đổi số?", qType: "single", ao: false },
        { gid: 3, code: "3.2", content: "Doanh nghiệp có kế hoạch/chiến lược chuyển đổi số?", qType: "single", ao: false },
        { gid: 3, code: "3.3", content: "Doanh nghiệp có người phụ trách chuyển đổi số không?", qType: "single", ao: false },
        { gid: 3, code: "3.4", content: "Doanh nghiệp có ngân sách riêng cho chuyển đổi số?", qType: "single", ao: false },
        { gid: 4, code: "4.1", content: "Rào cản lớn nhất khi chuyển đổi số?", qType: "multiple", ao: true },
        { gid: 4, code: "4.2", content: "Doanh nghiệp cần hỗ trợ gì để chuyển đổi số?", qType: "multiple", ao: true },
        { gid: 4, code: "4.3", content: "Doanh nghiệp sẵn sàng đầu tư cho CĐS trong 12 tháng tới?", qType: "single", ao: false },
        { gid: 4, code: "4.4", content: "Doanh nghiệp đã từng nhận hỗ trợ chuyển đổi số?", qType: "single", ao: false },
        { gid: 5, code: "5.1", content: "Mục tiêu chính khi chuyển đổi số?", qType: "multiple", ao: false },
        { gid: 5, code: "5.2", content: "Mức độ sẵn sàng chuyển đổi số của doanh nghiệp?", qType: "single", ao: false },
        { gid: 5, code: "5.3", content: "Nỗ lực chuyển đổi số trước đây có hiệu quả?", qType: "single", ao: false },
        { gid: 6, code: "6.1", content: "Chia sẻ thêm của doanh nghiệp?", qType: "open", ao: true },
      ];
      for (let i = 0; i < qData.length; i++) {
        const q = qData[i];
        await req()
          .input("gid", sql.Int, q.gid)
          .input("code", sql.NVarChar(50), q.code)
          .input("content", sql.NVarChar(2000), q.content)
          .input("qtype", sql.NVarChar(20), q.qType)
          .input("ao", sql.Bit, q.ao)
          .input("sort", sql.Int, i)
          .query(`
            INSERT INTO dbo.Questions (GroupId, Code, Content, QuestionType, AllowOther, IsOptional, SortOrder)
            VALUES (@gid, @code, @content, @qtype, @ao, 0, @sort)
          `);
      }
      logger.info(`Seeded ${qData.length} common questions`);

      // Cập nhật câu 6.1 thành optional (chia sẻ thêm, không bắt buộc)
      await req().query(`UPDATE dbo.Questions SET IsOptional = 1 WHERE Code = '6.1'`);
      logger.info("Set question 6.1 as optional");

      // ---- Industry-specific questions (nhóm 7) for ALL 25 industries ----
      const group7Id = 7;
      const indQs: { industryId: number; code: string; content: string }[] = [];
      for (let idx = 1; idx <= 25; idx++) {
        const names = [
          "", "Bán lẻ", "Sắt thép", "Du lịch, lữ hành", "Ô tô – xe máy",
          "Sức khỏe, sắc đẹp", "Môi trường", "Vận tải hành khách", "Giáo dục đào tạo",
          "Lưu trú, khách sạn", "Bất động sản", "Dược phẩm", "Dịch vụ kế toán",
          "Ăn uống, nhà hàng", "Cao su", "Logistics", "Nông nghiệp",
          "Nhựa", "May mặc", "Gas - xăng dầu", "Thiết bị y tế",
          "Khoáng sản", "Thủy sản", "Bao bì", "Giấy", "Xây dựng"
        ];
        indQs.push({ industryId: idx, code: `7.1.${String(idx).padStart(2,"0")}`, content: `Doanh nghiệp ngành ${names[idx]} đã ứng dụng công nghệ số trong hoạt động cốt lõi?` });
      }
      for (let j = 0; j < indQs.length; j++) {
        const iq = indQs[j];
        const qRes = await req()
          .input("gid", sql.Int, group7Id)
          .input("code", sql.NVarChar(50), iq.code)
          .input("content", sql.NVarChar(2000), iq.content)
          .input("sort", sql.Int, j)
          .query(`
            INSERT INTO dbo.Questions (GroupId, Code, Content, QuestionType, AllowOther, IsOptional, SortOrder)
            OUTPUT INSERTED.Id
            VALUES (@gid, @code, @content, 'single', 0, 0, @sort)
          `);
        const qId = qRes.recordset[0].Id as number;
        await req()
          .input("indId", sql.Int, iq.industryId)
          .input("qId", sql.Int, qId)
          .input("sort", sql.Int, j)
          .query(`INSERT INTO dbo.IndustryQuestions (IndustryId, QuestionId, SortOrder) VALUES (@indId, @qId, @sort)`);
      }
      logger.info(`Seeded ${indQs.length} industry questions`);
    }

    // ===================================================================
    // 6. AnswerOptions
    // ===================================================================
    logger.info("Đang seed AnswerOptions...");
    if ((await req().query("SELECT COUNT(1) cnt FROM dbo.AnswerOptions")).recordset[0].cnt === 0) {
      const allQ = await req().query("SELECT Id, Code, QuestionType, AllowOther FROM dbo.Questions ORDER BY Id");
      const multiOptionMap: Record<string, string[]> = {
        "2.1": ["Lưu trữ dữ liệu đám mây", "Phần mềm kế toán online", "CRM/ERP trên cloud", "Email doanh nghiệp (M365/Workspace)", "Không sử dụng"],
        "2.4": ["Tường lửa (Firewall)", "Phần mềm diệt virus", "Sao lưu dữ liệu định kỳ", "Xác thực 2 lớp (2FA)", "Không có biện pháp nào"],
        "2.5": ["Website doanh nghiệp", "Mạng xã hội (Facebook, Zalo)", "Email marketing", "Sàn thương mại điện tử", "Ứng dụng di động"],
        "4.1": ["Thiếu ngân sách", "Thiếu nhân lực có kỹ năng", "Lãnh đạo chưa quan tâm", "Công nghệ thay đổi nhanh", "Thiếu thông tin về CĐS"],
        "4.2": ["Tư vấn chiến lược CĐS", "Hỗ trợ tài chính", "Đào tạo nhân lực", "Giới thiệu giải pháp công nghệ", "Kết nối đối tác công nghệ"],
        "5.1": ["Tăng doanh thu", "Giảm chi phí vận hành", "Nâng cao trải nghiệm khách hàng", "Tối ưu quy trình nội bộ", "Mở rộng thị trường"],
      };
      for (const q of allQ.recordset) {
        const qId = q.Id as number;
        const qCode = q.Code as string;
        const qType = q.QuestionType as string;
        const allowOther = q.AllowOther as boolean;
        if (qType === "open") continue;
        const opts: { code: string; content: string; score: number; isOther: boolean }[] = [];
        if (qCode === "1.1") {
          opts.push({ code: "A", content: "<10 người", score: 0, isOther: false }, { code: "B", content: "10-50 người", score: 0.25, isOther: false }, { code: "C", content: "51-100 người", score: 0.5, isOther: false }, { code: "D", content: "101-200 người", score: 0.75, isOther: false }, { code: "E", content: ">200 người", score: 1, isOther: false });
        } else if (qCode === "1.2") {
          opts.push({ code: "A", content: "<1 tỷ đồng", score: 0, isOther: false }, { code: "B", content: "1-5 tỷ đồng", score: 0.25, isOther: false }, { code: "C", content: "5-20 tỷ đồng", score: 0.5, isOther: false }, { code: "D", content: "20-50 tỷ đồng", score: 0.75, isOther: false }, { code: "E", content: ">50 tỷ đồng", score: 1, isOther: false });
        } else if (qType === "single") {
          opts.push({ code: "A", content: "Chưa triển khai / Không có", score: 0, isOther: false }, { code: "B", content: "Mức cơ bản", score: 0.25, isOther: false }, { code: "C", content: "Mức trung bình", score: 0.5, isOther: false }, { code: "D", content: "Mức tốt", score: 0.75, isOther: false }, { code: "E", content: "Mức xuất sắc", score: 1, isOther: false });
        } else {
          const labels = multiOptionMap[qCode] || ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D", "Lựa chọn E"];
          const multCodes = ["A","B","C","D","E"];
          for (let mi = 0; mi < labels.length; mi++) opts.push({ code: multCodes[mi], content: labels[mi], score: 0.2, isOther: false });
        }
        if (allowOther && qType !== "open") opts.push({ code: "OTHER", content: "Khác (vui lòng ghi rõ)", score: 0, isOther: true });
        for (let k = 0; k < opts.length; k++) {
          await req().input("qid", sql.Int, qId).input("code", sql.NVarChar(20), opts[k].code).input("content", sql.NVarChar(1000), opts[k].content).input("score", sql.Decimal(9,4), opts[k].score).input("isOther", sql.Bit, opts[k].isOther).input("sort", sql.Int, k)
            .query("INSERT INTO dbo.AnswerOptions (QuestionId, Code, Content, Score, IsOther, SortOrder) VALUES (@qid, @code, @content, @score, @isOther, @sort)");
        }
      }
      logger.info("Seeded AnswerOptions");
    }

    // ===================================================================
    // 7. Solutions (giải pháp công nghệ - nhóm 7 / Phụ lục 3)
    // ===================================================================
    logger.info("Đang seed Solutions...");
    if ((await req().query("SELECT COUNT(1) cnt FROM dbo.Solutions")).recordset[0].cnt === 0) {
      const solData: { code: string; name: string }[][] = [
        [], // 0 placeholder
        [{ code:"S01_01", name:"Hệ thống POS và quản lý bán hàng" },{ code:"S01_02", name:"Bán hàng đa kênh (omni-channel)" },{ code:"S01_03", name:"CRM và khách hàng thân thiết" }],
        [{ code:"S02_01", name:"Quản lý kho bãi thông minh" },{ code:"S02_02", name:"Hệ thống theo dõi đơn hàng số" },{ code:"S02_03", name:"Dự báo nhu cầu bằng AI" }],
        [{ code:"S03_01", name:"Hệ thống đặt tour/đặt phòng trực tuyến" },{ code:"S03_02", name:"Chatbot tư vấn du lịch 24/7" },{ code:"S03_03", name:"CRM ngành du lịch" }],
        [{ code:"S04_01", name:"Phần mềm quản lý xưởng dịch vụ" },{ code:"S04_02", name:"Hệ thống đặt lịch bảo dưỡng online" },{ code:"S04_03", name:"Theo dõi phụ tùng và tồn kho" }],
        [{ code:"S05_01", name:"Phần mềm đặt lịch hẹn online" },{ code:"S05_02", name:"Quản lý hồ sơ khách hàng điện tử" },{ code:"S05_03", name:"Marketing tự động" }],
        [{ code:"S06_01", name:"Hệ thống giám sát môi trường IoT" },{ code:"S06_02", name:"Phần mềm quản lý chất thải" }],
        [{ code:"S07_01", name:"Hệ thống quản lý đội xe GPS" },{ code:"S07_02", name:"Nền tảng đặt vé trực tuyến" },{ code:"S07_03", name:"Theo dõi hành trình real-time" }],
        [{ code:"S08_01", name:"Hệ thống quản lý học tập (LMS)" },{ code:"S08_02", name:"Nền tảng lớp học trực tuyến" },{ code:"S08_03", name:"Quản lý học viên và điểm danh" }],
        [{ code:"S09_01", name:"Hệ thống quản lý khách sạn (PMS)" },{ code:"S09_02", name:"Kênh đặt phòng trực tuyến (OTA)" },{ code:"S09_03", name:"Quản lý buồng phòng thông minh" }],
        [{ code:"S10_01", name:"Nền tảng quản lý danh mục BĐS" },{ code:"S10_02", name:"CRM chăm sóc khách hàng BĐS" },{ code:"S10_03", name:"Tour 3D/VR tham quan BĐS" }],
        [{ code:"S11_01", name:"Hệ thống quản lý chuỗi cung ứng dược" },{ code:"S11_02", name:"Phần mềm quản lý nhà thuốc GPP" },{ code:"S11_03", name:"Theo dõi hạn sử dụng và tồn kho" }],
        [{ code:"S12_01", name:"Phần mềm kế toán và quản lý thuế" },{ code:"S12_02", name:"Hệ thống kê khai thuế điện tử" },{ code:"S12_03", name:"Chữ ký số và hóa đơn điện tử" }],
        [{ code:"S13_01", name:"Hệ thống đặt bàn và quản lý nhà hàng" },{ code:"S13_02", name:"Ứng dụng giao đồ ăn trực tuyến" },{ code:"S13_03", name:"Quản lý nguyên liệu và bếp" }],
        [{ code:"S14_01", name:"Hệ thống quản lý sản xuất cao su" },{ code:"S14_02", name:"Giám sát chất lượng tự động" }],
        [{ code:"S15_01", name:"Hệ thống quản lý vận tải (TMS)" },{ code:"S15_02", name:"Hệ thống quản lý kho (WMS)" },{ code:"S15_03", name:"Theo dõi đơn hàng real-time" }],
        [{ code:"S16_01", name:"Hệ thống IoT nông nghiệp thông minh" },{ code:"S16_02", name:"Truy xuất nguồn gốc nông sản" },{ code:"S16_03", name:"Dự báo thời tiết và sâu bệnh" }],
        [{ code:"S17_01", name:"Hệ thống quản lý sản xuất nhựa" },{ code:"S17_02", name:"Kiểm soát chất lượng tự động" }],
        [{ code:"S18_01", name:"Hệ thống thiết kế và quản lý sản xuất" },{ code:"S18_02", name:"Quản lý chuỗi cung ứng may mặc" },{ code:"S18_03", name:"Kênh bán hàng online" }],
        [{ code:"S19_01", name:"Hệ thống quản lý điểm bán xăng dầu" },{ code:"S19_02", name:"Giám sát tồn kho tự động" },{ code:"S19_03", name:"Hệ thống cảnh báo an toàn" }],
        [{ code:"S20_01", name:"Hệ thống quản lý thiết bị y tế" },{ code:"S20_02", name:"Theo dõi bảo trì và hiệu chuẩn" },{ code:"S20_03", name:"Quản lý hồ sơ thiết bị số" }],
        [{ code:"S21_01", name:"Hệ thống giám sát khai thác" },{ code:"S21_02", name:"Quản lý an toàn lao động số" }],
        [{ code:"S22_01", name:"Hệ thống truy xuất nguồn gốc thủy sản" },{ code:"S22_02", name:"Giám sát môi trường nuôi trồng IoT" },{ code:"S22_03", name:"Quản lý chuỗi lạnh" }],
        [{ code:"S23_01", name:"Hệ thống quản lý sản xuất bao bì" },{ code:"S23_02", name:"Thiết kế và in ấn kỹ thuật số" }],
        [{ code:"S24_01", name:"Hệ thống quản lý sản xuất giấy" },{ code:"S24_02", name:"Giám sát tiêu thụ năng lượng" },{ code:"S24_03", name:"Quản lý tái chế và môi trường" }],
        [{ code:"S25_01", name:"Phần mềm quản lý dự án xây dựng (BIM)" },{ code:"S25_02", name:"Giám sát công trình từ xa" },{ code:"S25_03", name:"Quản lý vật tư và nhân công" }],
      ];
      const solIdMap: Record<string, number> = {};
      for (let indId = 1; indId <= 25; indId++) {
        for (let si = 0; si < solData[indId].length; si++) {
          const s = solData[indId][si];
          const sRes = await req()
            .input("indId", sql.Int, indId).input("code", sql.NVarChar(50), s.code).input("name", sql.NVarChar(500), s.name).input("sort", sql.Int, si)
            .query(`INSERT INTO dbo.Solutions (IndustryId, Code, Name, SortOrder) OUTPUT INSERTED.Id VALUES (@indId, @code, @name, @sort)`);
          solIdMap[s.code] = sRes.recordset[0].Id as number;
        }
      }
      logger.info("Seeded Solutions for all 25 industries");

      // SolutionDependencies (Phụ lục 3: solutions có dependency → 0.5 điểm)
      if ((await req().query("SELECT COUNT(1) cnt FROM dbo.SolutionDependencies")).recordset[0].cnt === 0) {
        const deps: [string, string][] = [
          ["S01_02","S01_01"], // Bán hàng đa kênh phụ thuộc POS
          ["S03_02","S03_01"], // Chatbot phụ thuộc hệ thống đặt tour
          ["S09_02","S09_01"], // OTA phụ thuộc PMS
          ["S15_03","S15_01"], // Tracking phụ thuộc TMS
          ["S16_02","S16_01"], // Truy xuất nguồn gốc phụ thuộc IoT
          ["S18_02","S18_01"], // Chuỗi cung ứng phụ thuộc thiết kế
        ];
        for (const [child, parent] of deps) {
          if (solIdMap[child] && solIdMap[parent]) {
            await req()
              .input("sid", sql.Int, solIdMap[child]).input("did", sql.Int, solIdMap[parent])
              .query("INSERT INTO dbo.SolutionDependencies (SolutionId, DependsOnSolutionId) VALUES (@sid, @did)");
          }
        }
        logger.info("Seeded SolutionDependencies");
      }
    }

    // ===================================================================
    // 8. RankThresholds (5 cấp)
    // ===================================================================
    logger.info("Đang seed RankThresholds...");
    if ((await req().query("SELECT COUNT(1) cnt FROM dbo.RankThresholds")).recordset[0].cnt === 0) {
      await req().query(`
        INSERT INTO dbo.RankThresholds (Level, Code, Name, MinScore, MaxScore, Description)
        VALUES
          (1, 'LV1', N'Cấp độ 1 - Mới bắt đầu',    0, 20,  N'Doanh nghiệp chưa có hoạt động chuyển đổi số đáng kể'),
          (2, 'LV2', N'Cấp độ 2 - Cơ bản',         21, 40, N'Doanh nghiệp đã có những bước đầu chuyển đổi số'),
          (3, 'LV3', N'Cấp độ 3 - Trung bình',      41, 60, N'Doanh nghiệp đã triển khai CĐS ở mức trung bình'),
          (4, 'LV4', N'Cấp độ 4 - Khá',             61, 80, N'Doanh nghiệp có mức độ CĐS khá tốt'),
          (5, 'LV5', N'Cấp độ 5 - Xuất sắc',        81, 100,N'Doanh nghiệp dẫn đầu về chuyển đổi số')
      `);
      logger.info("Seeded 5 RankThresholds");
    }

    // ===================================================================
    // Commit
    // ===================================================================
    await tx.commit();
    logger.info("Seed hoàn tất!");
  } catch (err) {
    logger.error({ err }, "Lỗi khi seed, rolling back...");
    // tx will auto-rollback on error
    throw err;
  }
};

seed()
  .then(() => {
    logger.info("Seed script finished");
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, "Seed script failed");
    process.exit(1);
  });
