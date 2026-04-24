export type Target = {
  name: string;
  url: string;
  group: "중앙부처" | "공공포털" | "광역자치단체" | "해외정부";
};

export const TARGETS: Target[] = [
  { name: "대통령실", url: "https://www.president.go.kr", group: "중앙부처" },
  { name: "국무조정실", url: "https://www.opm.go.kr", group: "중앙부처" },
  { name: "기획재정부", url: "https://www.moef.go.kr", group: "중앙부처" },
  { name: "교육부", url: "https://www.moe.go.kr", group: "중앙부처" },
  { name: "과학기술정보통신부", url: "https://www.msit.go.kr", group: "중앙부처" },
  { name: "외교부", url: "https://www.mofa.go.kr", group: "중앙부처" },
  { name: "통일부", url: "https://www.unikorea.go.kr", group: "중앙부처" },
  { name: "법무부", url: "https://www.moj.go.kr", group: "중앙부처" },
  { name: "국방부", url: "https://www.mnd.go.kr", group: "중앙부처" },
  { name: "행정안전부", url: "https://www.mois.go.kr", group: "중앙부처" },
  { name: "문화체육관광부", url: "https://www.mcst.go.kr", group: "중앙부처" },
  { name: "농림축산식품부", url: "https://www.mafra.go.kr", group: "중앙부처" },
  { name: "산업통상자원부", url: "https://www.motie.go.kr", group: "중앙부처" },
  { name: "보건복지부", url: "https://www.mohw.go.kr", group: "중앙부처" },
  { name: "환경부", url: "https://www.me.go.kr", group: "중앙부처" },
  { name: "고용노동부", url: "https://www.moel.go.kr", group: "중앙부처" },
  { name: "여성가족부", url: "https://www.mogef.go.kr", group: "중앙부처" },
  { name: "국토교통부", url: "https://www.molit.go.kr", group: "중앙부처" },
  { name: "해양수산부", url: "https://www.mof.go.kr", group: "중앙부처" },
  { name: "중소벤처기업부", url: "https://www.mss.go.kr", group: "중앙부처" },

  { name: "대한민국 정책브리핑", url: "https://www.korea.kr", group: "공공포털" },
  { name: "공공데이터포털", url: "https://www.data.go.kr", group: "공공포털" },
  { name: "국가법령정보센터", url: "https://www.law.go.kr", group: "공공포털" },
  { name: "정부24", url: "https://www.gov.kr", group: "공공포털" },

  { name: "서울특별시", url: "https://www.seoul.go.kr", group: "광역자치단체" },
  { name: "부산광역시", url: "https://www.busan.go.kr", group: "광역자치단체" },
  { name: "경기도", url: "https://www.gg.go.kr", group: "광역자치단체" },

  { name: "gov.uk", url: "https://www.gov.uk", group: "해외정부" },
  { name: "usa.gov", url: "https://www.usa.gov", group: "해외정부" },
  { name: "digital.gov (US)", url: "https://www.digital.gov", group: "해외정부" },
];

export type RankingEntry = {
  name: string;
  url: string;
  group: Target["group"];
  grade: string;
  totalScore: number;
  totalMax: number;
  categories: { id: string; title: string; score: number; max: number }[];
  error?: string;
};

export type RankingSnapshot = {
  generatedAt: string;
  entries: RankingEntry[];
};
