import type { Questionnaire } from '../types';

// Helper: normalize both PascalCase (backend raw) and camelCase (mapped)
const pc = (obj: any, camel: string, pascal: string) =>
  obj?.[camel] ?? obj?.[pascal];

export function adaptQuestionnaire(data: any): Questionnaire {
  return {
    id: pc(data.questionnaire, 'id', 'Id'),
    tenBoKhaoSat: pc(data.questionnaire, 'name', 'Name'),
    moTa: pc(data.questionnaire, 'description', 'Description'),
    phienBan: pc(data.questionnaire, 'code', 'Code'),
    nhomCauHois: data.groups?.map((g: any) => ({
      nhom: pc(g, 'groupNumber', 'GroupNumber'),
      tenNhom: pc(g, 'name', 'Name'),
      moTa: pc(g, 'description', 'Description'),
      cauHois: g.questions?.map((q: any) => ({
        id: pc(q, 'id', 'Id'),
        maCauHoi: pc(q, 'code', 'Code'),
        noiDung: pc(q, 'content', 'Content'),
        nhom: pc(g, 'groupNumber', 'GroupNumber'),
        thuTu: 0,
        loai: (() => {
          const qt = pc(q, 'questionType', 'QuestionType') ?? 'single';
          return qt === 'open' ? 'text' : qt === 'multiple' ? 'multiple' : 'single';
        })(),
        batBuoc: !(pc(q, 'isOptional', 'IsOptional') ?? false),
        moTa: '',
        luaChon: q.options?.map((o: any) => ({
          id: pc(o, 'id', 'Id'),
          maLuaChon: pc(o, 'code', 'Code'),
          noiDung: pc(o, 'content', 'Content'),
          diem: pc(o, 'score', 'Score'),
          coKhac: pc(o, 'isOther', 'IsOther'),
        })) ?? [],
      })) ?? [],
    })) ?? [],
    danhSachNganh: data.industries?.map((i: any) => ({
      id: pc(i, 'id', 'Id'),
      ma: pc(i, 'code', 'Code'),
      ten: pc(i, 'name', 'Name'),
    })) ?? [],
  };
}