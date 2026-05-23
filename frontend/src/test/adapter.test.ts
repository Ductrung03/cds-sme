import { describe, it, expect } from 'vitest';
import { adaptQuestionnaire } from '../api/adapter';

describe('adaptQuestionnaire', () => {
  const mockBackend = {
    questionnaire: {
      id: 1,
      code: 'V1.0',
      name: 'Bộ khảo sát CĐS SME',
      description: 'Mô tả bộ khảo sát',
    },
    groups: [
      {
        groupNumber: 1,
        name: 'Nhóm 1: Thông tin chung',
        description: null,
        questions: [
          {
            id: 1,
            code: '1.1',
            content: 'Số lượng lao động?',
            questionType: 'single',
            isOptional: false,
            options: [
              { id: 1, code: 'A', content: '<10 người', score: 0, isOther: false },
              { id: 2, code: 'B', content: '10-50 người', score: 0.25, isOther: false },
            ],
          },
        ],
      },
      {
        groupNumber: 2,
        name: 'Nhóm 2: Hạ tầng và ứng dụng CN số',
        description: null,
        questions: [
          {
            id: 10,
            code: '2.1',
            content: 'Sử dụng cloud?',
            questionType: 'multiple',
            isOptional: false,
            options: [
              { id: 11, code: 'A', content: 'Lưu trữ đám mây', score: 0.2, isOther: false },
              { id: 12, code: 'OTHER', content: 'Khác (vui lòng ghi rõ)', score: 0, isOther: true },
            ],
          },
        ],
      },
      {
        groupNumber: 6,
        name: 'Nhóm 6: Chia sẻ thêm',
        description: null,
        questions: [
          {
            id: 30,
            code: '6.1',
            content: 'Chia sẻ thêm?',
            questionType: 'open',
            isOptional: true,
            options: [],
          },
        ],
      },
    ],
    industries: [
      { id: 1, code: 'IND01', name: 'Bán lẻ' },
      { id: 2, code: 'IND02', name: 'Sắt thép' },
    ],
  };

  it('trả về đúng cấu trúc Questionnaire', () => {
    const result = adaptQuestionnaire(mockBackend);
    expect(result.id).toBe(1);
    expect(result.tenBoKhaoSat).toBe('Bộ khảo sát CĐS SME');
    expect(result.phienBan).toBe('V1.0');
    expect(result.moTa).toBe('Mô tả bộ khảo sát');
  });

  it('chuyển đổi groups -> nhomCauHois', () => {
    const result = adaptQuestionnaire(mockBackend);
    expect(result.nhomCauHois).toHaveLength(3);
    expect(result.nhomCauHois[0].nhom).toBe(1);
    expect(result.nhomCauHois[0].tenNhom).toBe('Nhóm 1: Thông tin chung');
  });

  it('chuyển đổi questions với options', () => {
    const result = adaptQuestionnaire(mockBackend);
    const q1 = result.nhomCauHois[0].cauHois[0];
    expect(q1.id).toBe(1);
    expect(q1.maCauHoi).toBe('1.1');
    expect(q1.noiDung).toBe('Số lượng lao động?');
    expect(q1.loai).toBe('single');
    expect(q1.batBuoc).toBe(true);
    expect(q1.luaChon).toHaveLength(2);
    expect(q1.luaChon[0].maLuaChon).toBe('A');
    expect(q1.luaChon[0].noiDung).toBe('<10 người');
    expect(q1.luaChon[0].diem).toBe(0);
    expect(q1.luaChon[0].coKhac).toBe(false);
  });

  it('chuyển đổi multiple -> multiple', () => {
    const result = adaptQuestionnaire(mockBackend);
    const q21 = result.nhomCauHois[1].cauHois[0];
    expect(q21.loai).toBe('multiple');
    expect(q21.luaChon[1].coKhac).toBe(true);
  });

  it('chuyển đổi open -> text', () => {
    const result = adaptQuestionnaire(mockBackend);
    const q61 = result.nhomCauHois[2].cauHois[0];
    expect(q61.loai).toBe('text');
    expect(q61.luaChon).toEqual([]);
  });

  it('trả về danhSachNganh với id, ma, ten', () => {
    const result = adaptQuestionnaire(mockBackend);
    expect(result.danhSachNganh).toHaveLength(2);
    expect(result.danhSachNganh[0]).toEqual({ id: 1, ma: 'IND01', ten: 'Bán lẻ' });
    expect(result.danhSachNganh[1]).toEqual({ id: 2, ma: 'IND02', ten: 'Sắt thép' });
  });

  it('xử lý dữ liệu rỗng/null an toàn', () => {
    const result = adaptQuestionnaire({});
    expect(result.nhomCauHois).toEqual([]);
    expect(result.danhSachNganh).toEqual([]);
  });

  it('hỗ trợ PascalCase từ backend (options trả về Id, Code, Score, IsOther)', () => {
    const pascalBackend = {
      questionnaire: { Id: 1, Name: 'Bộ KS', Code: 'V2', Description: null },
      groups: [{
        GroupNumber: 1, Name: 'Nhóm 1', Description: null,
        questions: [{
          Id: 101, Code: 'Q1', Content: 'Câu hỏi 1', QuestionType: 'single',
          IsOptional: false, options: [
            { Id: 1, Code: 'A', Content: 'Đáp án A', Score: 5, IsOther: false },
            { Id: 2, Code: 'B', Content: 'Đáp án B', Score: 10, IsOther: true },
          ]
        }]
      }],
      industries: [{ Id: 10, Code: 'CNTT', Name: 'Công nghệ' }],
    };
    const result = adaptQuestionnaire(pascalBackend);
    expect(result.id).toBe(1);
    expect(result.tenBoKhaoSat).toBe('Bộ KS');
    expect(result.nhomCauHois).toHaveLength(1);
    const q = result.nhomCauHois[0].cauHois[0];
    expect(q.id).toBe(101);
    expect(q.luaChon).toHaveLength(2);
    expect(q.luaChon[0].diem).toBe(5);
    expect(q.luaChon[1].coKhac).toBe(true);
  });

  it('ID dạng GUID string được giữ nguyên', () => {
    const guidData = {
      questionnaire: { id: 'abc-123-guid', name: 'Bộ KS', code: 'V3', description: null },
      groups: [],
      industries: [],
    };
    const result = adaptQuestionnaire(guidData);
    expect(result.id).toBe('abc-123-guid');
    expect(typeof result.id).toBe('string');
  });
});
