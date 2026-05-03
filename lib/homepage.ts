import { HomeModule } from "@prisma/client";

export type HomeItem = {
  id: string;
  module: HomeModule;
  title: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
};

export const homeModuleLabels: Record<HomeModule, string> = {
  PROJECT: "历史项目",
  ACHIEVEMENT: "成果展示",
  TEAM_STYLE: "团队风采"
};

export const homeDefaults: Record<HomeModule, Omit<HomeItem, "id" | "module">[]> = {
  PROJECT: [
    {
      title: "校园二手交易平台",
      description: "基于小程序与服务端架构的校园交易系统，支持推荐、检索、发布与交易管理。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 1
    },
    {
      title: "竞赛协同管理平台",
      description: "覆盖项目立项、任务拆分、里程碑追踪与成果归档的团队协同工具。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 2
    },
    {
      title: "智能校园应用集",
      description: "围绕校园场景打造的一组 AI + 物联网应用原型与演示系统。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 3
    }
  ],
  ACHIEVEMENT: [
    {
      title: "省级/国家级竞赛奖项",
      description: "持续参与多项高水平竞赛，形成稳定的项目孵化与成果沉淀机制。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 1
    },
    {
      title: "开源与技术文档沉淀",
      description: "沉淀项目代码规范、部署文档和技术手册，支撑团队长期复用。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 2
    },
    {
      title: "校企合作与项目落地",
      description: "联合企业与实验室推进实践项目，把创意转化为可用产品能力。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 3
    }
  ],
  TEAM_STYLE: [
    {
      title: "团队讨论与技术评审",
      description: "每周固定开展复盘、评审与分享，保证项目持续迭代。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 1
    },
    {
      title: "赛事备赛与集训",
      description: "围绕目标赛事进行专项训练和实战演练，强化协同作战能力。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 2
    },
    {
      title: "活动与成果展示",
      description: "通过宣讲、展览和路演持续对外展示团队项目与成长路径。",
      imageUrl: "/api/assets/team-photo",
      sortOrder: 3
    }
  ]
};

export function getItemsByModule(items: HomeItem[], module: HomeModule) {
  const current = items.filter((item) => item.module === module).sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  if (current.length > 0) return current;
  return homeDefaults[module].map((item, index) => ({
    id: `default-${module}-${index + 1}`,
    module,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    sortOrder: item.sortOrder
  }));
}
