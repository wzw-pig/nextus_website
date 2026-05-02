import { Department, FloorTimeSlot, ResourceType } from "@prisma/client";

export const departments = [
  {
    slug: "management-committee",
    name: "管理委员会",
    value: Department.MANAGEMENT_COMMITTEE,
    description: "负责团队顶层治理、组织文化建设与重大制度制定。"
  },
  {
    slug: "ceo-office",
    name: "CEO办公室",
    value: Department.CEO_OFFICE,
    description: "负责项目统筹推进、跨部门协调以及核心事项跟踪。"
  },
  {
    slug: "risk-review-committee",
    name: "风险审查委员会",
    value: Department.RISK_REVIEW_COMMITTEE,
    description: "负责制度合规、项目风控与关键节点风险评估。"
  },
  {
    slug: "innovation-strategy",
    name: "创新战略部",
    value: Department.INNOVATION_STRATEGY,
    description: "负责科创方向研判、课题选型与创新方法体系建设。"
  },
  {
    slug: "tech-research",
    name: "技术研发部",
    value: Department.TECH_RESEARCH,
    description: "负责核心技术攻关、系统开发与技术文档沉淀。"
  },
  {
    slug: "market-operation",
    name: "市场运营部",
    value: Department.MARKET_OPERATION,
    description: "负责成果推广、对外合作、活动运营与品牌传播。"
  },
  {
    slug: "finance-budget",
    name: "财务预算部",
    value: Department.FINANCE_BUDGET,
    description: "负责经费规划、预算控制、费用核算与报销规范。"
  },
  {
    slug: "contest-management",
    name: "竞赛综合管理部",
    value: Department.CONTEST_MANAGEMENT,
    description: "负责赛事项目管理、赛程组织和参赛资源调度。"
  },
  {
    slug: "contest-member",
    name: "竞赛队员",
    value: Department.CONTEST_MEMBER,
    description: "负责具体项目执行、方案落地与竞赛成果产出。"
  }
] as const;

export const departmentBySlug = Object.fromEntries(departments.map((item) => [item.slug, item])) as Record<
  (typeof departments)[number]["slug"],
  (typeof departments)[number]
>;

export const forumCategoryPresets = [
  { name: "求助答疑", slug: "help" },
  { name: "部门公告", slug: "announcements" },
  { name: "质询建议", slug: "suggestions" }
] as const;

export const resourceTypeLabels: Record<ResourceType, string> = {
  SOFTWARE: "软件资料",
  VIDEO: "视频教程",
  DOCUMENT: "文档资料",
  OTHER: "其他"
};

export const departmentLabels: Record<Department, string> = Object.fromEntries(
  departments.map((item) => [item.value, item.name])
) as Record<Department, string>;

export const floorTimeSlotLabels: Record<FloorTimeSlot, string> = {
  S0800_1000: "8:00-10:00",
  S1000_1200: "10:00-12:00",
  S1200_1400: "12:00-14:00",
  S1400_1600: "14:00-16:00",
  S1600_1800: "16:00-18:00",
  S1800_2000: "18:00-20:00",
  S2000_2200: "20:00-22:00"
};
