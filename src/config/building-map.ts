import Floor1Pic from "@/assets/1楼.png";

export interface TerminalInfo {
  key: string;
  title: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
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
        x: 250,
        y: 150,
        width: 180,
        height: 200,
        terminals: [
          {
            key: "building-ZD0038",
            title: "91330109040",
            x: 250,
            y: 180,
            width: 60,
            height: 40,
          },
        ],
      },
      {
        key: "building-KJ0035",
        title: "研究生工作室",
        x: 440,
        y: 660,
        width: 200,
        height: 180,
        terminals: [
          {
            key: "building-ZD0037",
            title: "91330109027",
            x: 440,
            y: 710,
            width: 60,
            height: 40,
          },
        ],
      },
    ],
  },
];
