import Floor1Pic from "@/assets/1楼.png";

export interface TerminalInfo {
  key: string;
  title: string;
}

export interface RoomInfo {
  key: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  terminals: TerminalInfo[];
}

export interface BuildingMap {
  key: string;
  title: string;
  background: string;
  rooms: RoomInfo[];
}

export const buildingMaps: BuildingMap[] = [
  {
    key: "building-LY0001",
    title: "交通楼电子电气学院",
    background: Floor1Pic,
    rooms: [
      {
        key: "building-KJ0036",
        title: "双创中心",
        x: -45,
        y: 30,
        width: 200,
        height: 250,
        terminals: [
          {
            key: "building-ZD0038",
            title: "91330109040",
          },
        ],
      },
      {
        key: "building-KJ0035",
        title: "研究生工作室",
        x: 190,
        y: 660,
        width: 260,
        height: 190,
        terminals: [
          {
            key: "building-ZD0037",
            title: "91330109027",
          },
        ],
      },
    ],
  },
];
