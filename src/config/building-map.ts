const importFloorPic = (floor: number): string => {
  const modules = import.meta.glob("@/assets/*楼.png", {
    eager: true,
    query: "?url",
    import: "default",
  }) as Record<string, string>;
  return modules[`/src/assets/${floor}楼.png`];
};

const MAX_FLOOR = 10;

// 生成楼层背景映射
export const floorBackgrounds: { [floor: number]: string } = Object.fromEntries(
  Array.from({ length: MAX_FLOOR }, (_, i) => {
    const floor = i + 1;
    return [floor, importFloorPic(floor)];
  })
);

export interface TerminalInfo {
  key: string;
  title?: string;
}

export interface RoomInfo {
  key: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  terminals: TerminalInfo[];
}

export interface BuildingMap {
  key: string;
  title: string;
  rooms: RoomInfo[];
}

/*
格式：
 - 楼宇 > 房间 > 终端
 - 需定义终端，终端查找对应传感器

房间确定楼层背景
*/

export const buildingMaps: BuildingMap[] = [
  {
    key: "building-LY0001",
    title: "交通楼电子电气学院",

    rooms: [
      {
        key: "building-KJ0001",
        title: "新能源技术实验室",
        x: 530,
        y: -20,
        width: 440,
        height: 300,
        floor: 1,
        terminals: [
          {
            key: "building-ZD0001",
            title: "91330109057",
          },
        ],
      },
      {
        key: "building-KJ0002",
        title: "电机与电气技术实验室",
        x: 530,
        y: 440,
        width: 440,
        height: 350,
        floor: 1,
        terminals: [
          {
            key: "building-ZD0003",
            title: "91330109044",
          },
          {
            key: "building-ZD0002",
            title: "91330109042",
          },
        ],
      },
      {
        key: "building-KJ0022",
        title: "电力电子与电机拖动实验室",
        x: 2530,
        y: 540,
        width: 400,
        height: 250,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0023",
            title: "91330109059",
          },
        ],
      },
      {
        key: "building-KJ0012",
        title: "自控理论与微机实验室2",
        x: -80,
        y: 540,
        width: 300,
        height: 510,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0013",
            title: "91330109034",
          },
        ],
      },
      {
        key: "building-KJ0004",
        title: "电力系统仿真实验室",
        x: 310,
        y: 560,
        width: 300,
        height: 500,
        floor: 2,
        terminals: [
          {
            key: "building-ZD0005",
            title: "91330109050",
          },
        ],
      },
      {
        key: "building-KJ0003",
        title: "电气控制与PLC实验室",
        x: 705,
        y: 560,
        width: 300,
        height: 500,
        floor: 2,
        terminals: [
          {
            key: "building-ZD0004",
            title: "91330109043",
          },
        ],
      },
      {
        key: "building-KJ0010",
        title: "Proteus实验室",
        x: -480,
        y: 550,
        width: 300,
        height: 500,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0011",
            title: "91330109036",
          },
        ],
      },
      {
        key: "building-KJ0007",
        title: "电路实验室",
        x: 700,
        y: -40,
        width: 750,
        height: 320,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0008",
            title: "91330109046",
          },
        ],
      },
      {
        key: "building-KJ0008",
        title: "电子开放实验室",
        x: -60,
        y: -40,
        width: 250,
        height: 320,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0009",
            title: "91330109055",
          },
        ],
      },
      {
        key: "building-KJ0009",
        title: "数字电子实验室",
        x: 760,
        y: 510,
        width: 650,
        height: 520,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0010",
            title: "91330109028",
          },
        ],
      },
      {
        key: "building-KJ0011",
        title: "自控理论与微机实验室1",
        x: 300,
        y: 540,
        width: 300,
        height: 510,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0012",
            title: "91330109061",
          },
        ],
      },
      {
        key: "building-KJ0006",
        title: "数模拟电子实验室",
        x: 1590,
        y: -20,
        width: 650,
        height: 320,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0007",
            title: "91330109049",
          },
        ],
      },
      {
        key: "building-KJ0005",
        title: "数模拟电子实验室",
        x: 2360,
        y: -20,
        width: 450,
        height: 280,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0006",
            title: "91330109052",
          },
        ],
      },
      {
        key: "building-KJ0017",
        title: "PCB制作实验室",
        x: -70,
        y: 450,
        width: 250,
        height: 430,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0018",
            title: "91330109062",
          },
        ],
      },
      {
        key: "building-KJ0014",
        title: "多数据融合与现代通信实验室",
        x: 600,
        y: -40,
        width: 650,
        height: 320,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0015",
            title: "91330109020",
          },
        ],
      },
      {
        key: "building-KJ0013",
        title: "电子信息基础实验室",
        x: 1320,
        y: -40,
        width: 580,
        height: 320,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0015",
            title: "91330109020",
          },
        ],
      },
      {
        key: "building-KJ0016",
        title: "无线通信实验室",
        x: 270,
        y: 450,
        width: 250,
        height: 430,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0017",
            title: "91330109021",
          },
        ],
      },
      {
        key: "building-KJ0015",
        title: "数字电视实验室",
        x: 610,
        y: 450,
        width: 250,
        height: 430,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0016",
            title: "91330109038",
          },
        ],
      },
      {
        key: "building-KJ0024",
        title: "运动控制综合实验室",
        x: -80,
        y: -60,
        width: 310,
        height: 400,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0025",
            title: "91330109047",
          },
        ],
      },
      {
        key: "building-KJ0021",
        title: "运动控制综合实验室",
        x: -480,
        y: 600,
        width: 310,
        height: 460,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0022",
            title: "91330109058",
          },
        ],
      },
      {
        key: "building-KJ0023",
        title: "智能机器人综合实验室",
        x: -80,
        y: 600,
        width: 310,
        height: 460,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0024",
            title: "91330109060",
          },
        ],
      },
      {
        key: "building-KJ0018",
        title: "现代检测技术实验室",
        x: 2420,
        y: 10,
        width: 410,
        height: 260,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0019",
            title: "91330109048",
          },
        ],
      },
      {
        key: "building-KJ0019",
        title: "汽车总线通信实验室",
        x: 2030,
        y: -30,
        width: 330,
        height: 310,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0020",
            title: "91330109032",
          },
        ],
      },
      {
        key: "building-KJ0020",
        title: "汽车故障诊断综合实验室",
        x: 1400,
        y: -30,
        width: 530,
        height: 310,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0021",
            title: "91330109056",
          },
        ],
      },
      {
        key: "building-KJ0026",
        title: "网络实验室",
        x: 2300,
        y: 430,
        width: 230,
        height: 210,
        floor: 6,
        terminals: [
          {
            key: "building-ZD0027",
            title: "91330109041",
          },
        ],
      },
      {
        key: "building-KJ0027",
        title: "嵌入式实验室",
        x: 1760,
        y: -30,
        width: 300,
        height: 310,
        floor: 6,
        terminals: [
          {
            key: "building-ZD0028",
            title: "91330109037",
          },
        ],
      },
      {
        key: "building-KJ0028",
        title: "软件实验室1",
        x: 1400,
        y: -30,
        width: 300,
        height: 310,
        floor: 6,
        terminals: [
          {
            key: "building-ZD0029",
            title: "91330109022",
          },
        ],
      },
      {
        key: "building-KJ0025",
        title: "计算机硬件与机器视觉实验室",
        x: 2100,
        y: -30,
        width: 430,
        height: 310,
        floor: 6,
        terminals: [
          {
            key: "building-ZD0026",
            title: "91330109030",
          },
        ],
      },
      {
        key: "building-KJ0029",
        title: "软件实验室2",
        x: 700,
        y: -30,
        width: 530,
        height: 310,
        floor: 6,
        terminals: [
          {
            key: "building-ZD0031",
            title: "91330109023",
          },
        ],
      },
      {
        key: "building-KJ0031",
        title: "人工智能创新技术展示室",
        x: 2060,
        y: 450,
        width: 240,
        height: 210,
        floor: 7,
        terminals: [
          {
            key: "building-ZD0033",
            title: "91330109035",
          },
        ],
      },
      {
        key: "building-KJ0030",
        title: "5G创新联合实验室",
        x: -360,
        y: 450,
        width: 240,
        height: 410,
        floor: 7,
        terminals: [
          {
            key: "building-ZD0032",
            title: "91330109026",
          },
        ],
      },
      {
        key: "building-KJ0033",
        title: "研究生工作室",
        x: 1630,
        y: -30,
        width: 340,
        height: 260,
        floor: 8,
        terminals: [
          {
            key: "building-ZD0035",
            title: "91330109031",
          },
        ],
      },
      {
        key: "building-KJ0032",
        title: "研究生工作室",
        x: 930,
        y: -30,
        width: 540,
        height: 260,
        floor: 8,
        terminals: [
          {
            key: "building-ZD0034",
            title: "91330109033",
          },
        ],
      },
      {
        key: "building-KJ0035",
        title: "研究生工作室",
        x: 400,
        y: -30,
        width: 440,
        height: 260,
        floor: 8,
        terminals: [
          {
            key: "building-ZD0037",
            title: "91330109031",
          },
        ],
      },
      {
        key: "building-KJ0034",
        title: "研究生工作室",
        x: 130,
        y: -40,
        width: 100,
        height: 100,
        floor: 8,
        terminals: [
          {
            key: "building-ZD0036",
            title: "91330109040",
          },
        ],
      },
      {
        key: "building-KJ0036",
        title: "双创中心",
        x: 830,
        y: -30,
        width: 540,
        height: 260,
        floor: 10,
        terminals: [
          {
            key: "building-ZD0038",
            title: "91330109040",
          },
        ],
      },
    ],
  },
];
